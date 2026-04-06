import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// 허용된 리액션 타입
const REACTION_TYPES = ['like', 'haha', 'agree', 'thanks', 'wow'] as const
type ReactionType = typeof REACTION_TYPES[number]

// 리액션 조회 (GET)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const photoId = parseInt(id)

    if (isNaN(photoId)) {
      return NextResponse.json(
        { error: '유효하지 않은 사진 ID입니다.' },
        { status: 400 }
      )
    }

    // 사용자 확인
    const user = await getAuthUser()

    // 리액션 집계
    const reactions = await prisma.photoReaction.groupBy({
      by: ['type'],
      where: { photoId },
      _count: { type: true }
    })

    // 사용자의 리액션 조회
    let userReactions: string[] = []
    if (user) {
      const userReactionRecords = await prisma.photoReaction.findMany({
        where: { photoId, userId: user.id },
        select: { type: true }
      })
      userReactions = userReactionRecords.map(r => r.type)
    }

    // 결과 포맷팅
    const reactionCounts: Record<string, number> = {}
    for (const r of reactions) {
      reactionCounts[r.type] = r._count.type
    }

    return NextResponse.json({
      success: true,
      reactions: reactionCounts,
      userReactions,
      total: Object.values(reactionCounts).reduce((a, b) => a + b, 0)
    })

  } catch (error) {
    console.error('리액션 조회 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 리액션 토글 (POST)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const photoId = parseInt(id)

    if (isNaN(photoId)) {
      return NextResponse.json(
        { error: '유효하지 않은 사진 ID입니다.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { type = 'like' } = body

    // 유효한 리액션 타입인지 확인
    if (!REACTION_TYPES.includes(type as ReactionType)) {
      return NextResponse.json(
        { error: '유효하지 않은 리액션 타입입니다.' },
        { status: 400 }
      )
    }

    // 로그인 확인
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 사진 확인
    const photo = await prisma.galleryPhoto.findUnique({
      where: { id: photoId }
    })

    if (!photo) {
      return NextResponse.json(
        { error: '사진을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 기존 반응 확인 (같은 타입)
    const existingReaction = await prisma.photoReaction.findFirst({
      where: {
        userId: user.id,
        photoId,
        type
      }
    })

    let reacted = false

    if (existingReaction) {
      // 이미 반응이 있으면 취소
      await prisma.photoReaction.delete({
        where: { id: existingReaction.id }
      })

      // likeCount 감소
      await prisma.galleryPhoto.update({
        where: { id: photoId },
        data: { likeCount: { decrement: 1 } }
      })
    } else {
      // 반응 추가
      await prisma.photoReaction.create({
        data: {
          type,
          userId: user.id,
          photoId
        }
      })

      // likeCount 증가
      await prisma.galleryPhoto.update({
        where: { id: photoId },
        data: { likeCount: { increment: 1 } }
      })

      reacted = true
    }

    // 업데이트된 리액션 정보 조회
    const reactions = await prisma.photoReaction.groupBy({
      by: ['type'],
      where: { photoId },
      _count: { type: true }
    })

    const userReactionRecords = await prisma.photoReaction.findMany({
      where: { photoId, userId: user.id },
      select: { type: true }
    })

    const reactionCounts: Record<string, number> = {}
    for (const r of reactions) {
      reactionCounts[r.type] = r._count.type
    }

    return NextResponse.json({
      success: true,
      reacted,
      type,
      reactions: reactionCounts,
      userReactions: userReactionRecords.map(r => r.type),
      total: Object.values(reactionCounts).reduce((a, b) => a + b, 0)
    })

  } catch (error) {
    console.error('반응 처리 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

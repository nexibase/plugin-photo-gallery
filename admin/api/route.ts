import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser } from '@/lib/auth'

// 포토갤러리 목록 조회 (관리자)
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    // 검색 조건 (title만 검색 — author 관계 없음)
    const where: Record<string, unknown> = {}
    if (search) {
      where.title = { contains: search }
    }

    const [rawPhotos, total] = await Promise.all([
      prisma.galleryPhoto.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.galleryPhoto.count({ where }),
    ])

    // 별도 쿼리로 작성자 정보 조회
    const userIds = [...new Set(rawPhotos.map(p => p.userId))]
    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, nickname: true },
        })
      : []
    const userMap = new Map(users.map(a => [a.id, a]))

    const photos = rawPhotos.map(p => ({
      ...p,
      user: userMap.get(p.userId) || { id: p.userId, nickname: '알 수 없음' },
    }))

    return NextResponse.json({
      photos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('포토갤러리 목록 조회 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 포토갤러리 일괄 삭제
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: '삭제할 사진을 선택해주세요.' },
        { status: 400 }
      )
    }

    await prisma.galleryPhoto.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('포토갤러리 일괄 삭제 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

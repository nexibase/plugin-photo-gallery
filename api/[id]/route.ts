import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// 사진 상세 조회 (GET)
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

    // 조회수 증가 + 사진 조회
    const rawPhoto = await prisma.galleryPhoto.update({
      where: { id: photoId },
      data: { viewCount: { increment: 1 } },
    })

    // 별도 쿼리로 작성자 정보 조회
    const author = await prisma.user.findUnique({
      where: { id: rawPhoto.authorId },
      select: { id: true, nickname: true, image: true },
    })

    const photo = {
      ...rawPhoto,
      author: author || { id: rawPhoto.authorId, nickname: '알 수 없음', image: null },
    }

    return NextResponse.json({ photo })

  } catch (error) {
    console.error('사진 상세 조회 에러:', error)
    return NextResponse.json(
      { error: '사진을 찾을 수 없습니다.' },
      { status: 404 }
    )
  }
}

// 사진 삭제 (DELETE)
export async function DELETE(
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

    // 로그인 확인
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 사진 조회
    const photo = await prisma.galleryPhoto.findUnique({
      where: { id: photoId }
    })

    if (!photo) {
      return NextResponse.json(
        { error: '사진을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 권한 확인: 작성자, admin, manager만 삭제 가능
    const isAuthor = photo.authorId === user.id
    const isAdmin = user.role === 'admin' || user.role === 'manager'
    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: '삭제 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 물리 파일 삭제
    const basePath = path.join(process.cwd(), 'public')

    if (photo.imagePath) {
      const imageFull = path.join(basePath, photo.imagePath)
      if (existsSync(imageFull)) await unlink(imageFull)
    }

    if (photo.thumbnailPath) {
      const thumbFull = path.join(basePath, photo.thumbnailPath)
      if (existsSync(thumbFull)) await unlink(thumbFull)
    }

    // DB 레코드 삭제
    await prisma.galleryPhoto.delete({
      where: { id: photoId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('사진 삭제 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

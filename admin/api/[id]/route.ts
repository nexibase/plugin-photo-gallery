import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser } from '@/lib/auth'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// 포토갤러리 개별 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { id } = await params
    const photoId = parseInt(id)

    const photo = await prisma.galleryPhoto.findUnique({
      where: { id: photoId },
    })

    if (!photo) {
      return NextResponse.json(
        { error: '사진을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 물리 파일 삭제
    const basePath = path.join(process.cwd(), 'public')

    if (photo.imagePath) {
      const filePath = path.join(basePath, photo.imagePath)
      if (existsSync(filePath)) await unlink(filePath)
    }

    if (photo.thumbnailPath) {
      const thumbPath = path.join(basePath, photo.thumbnailPath)
      if (existsSync(thumbPath)) await unlink(thumbPath)
    }

    // DB 레코드 삭제
    await prisma.galleryPhoto.delete({
      where: { id: photoId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('포토갤러리 삭제 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

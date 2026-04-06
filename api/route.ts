import { NextRequest, NextResponse } from 'next/server'
import { mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import sharp from 'sharp'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// 허용 이미지 타입
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_WIDTH = 1200 // 최대 너비
const THUMB_SIZE = 400 // 썸네일 정사각형 크기
const QUALITY = 80 // 압축 품질
const THUMB_QUALITY = 70 // 썸네일 압축 품질

/**
 * GET /api/photo-gallery — 사진 목록 (페이지네이션, 검색, 정렬)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const search = searchParams.get('search')?.trim() || ''
    const sort = searchParams.get('sort') || 'latest'

    const skip = (page - 1) * limit

    // 검색 조건
    const where = search
      ? {
          OR: [
            { title: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {}

    // 정렬 조건
    const orderBy =
      sort === 'popular'
        ? [{ likeCount: 'desc' as const }, { createdAt: 'desc' as const }]
        : [{ createdAt: 'desc' as const }]

    const [rawPhotos, total] = await Promise.all([
      prisma.galleryPhoto.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.galleryPhoto.count({ where }),
    ])

    // 별도 쿼리로 작성자 정보 조회
    const userIds = [...new Set(rawPhotos.map(p => p.userId))]
    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, nickname: true, image: true },
        })
      : []
    const userMap = new Map(users.map(a => [a.id, a]))

    const photos = rawPhotos.map(p => ({
      ...p,
      user: userMap.get(p.userId) || { id: p.userId, nickname: '알 수 없음', image: null },
    }))

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      photos,
      total,
      page,
      totalPages,
    })
  } catch (error) {
    console.error('갤러리 목록 조회 에러:', error)
    return NextResponse.json(
      { error: '갤러리 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/photo-gallery — 사진 업로드
 */
export async function POST(request: NextRequest) {
  try {
    // 로그인 확인
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const title = (formData.get('title') as string | null)?.trim()
    const description = (formData.get('description') as string | null)?.trim() || null
    const file = formData.get('image') as File | null

    // 제목 필수
    if (!title) {
      return NextResponse.json(
        { error: '제목을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 이미지 필수
    if (!file) {
      return NextResponse.json(
        { error: '이미지 파일을 선택해주세요.' },
        { status: 400 }
      )
    }

    // 파일 타입 검증
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'JPG, PNG, GIF, WebP 파일만 업로드 가능합니다.' },
        { status: 400 }
      )
    }

    // 파일 크기 검증
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: '파일 크기는 5MB 이하여야 합니다.' },
        { status: 400 }
      )
    }

    // 파일명 생성
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)

    // 업로드 디렉토리: /public/uploads/gallery/{year}/{month}/
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'gallery', String(year), month)
    const urlPath = `/uploads/gallery/${year}/${month}`

    // Path Traversal 방지: 최종 경로가 uploads/ 내부인지 확인
    const allowedBase = path.resolve(process.cwd(), 'public', 'uploads')
    const resolvedDir = path.resolve(uploadDir)
    if (!resolvedDir.startsWith(allowedBase + path.sep) && resolvedDir !== allowedBase) {
      return NextResponse.json(
        { error: '잘못된 업로드 경로입니다.' },
        { status: 400 }
      )
    }

    // 디렉토리 생성
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // 이미지 리사이징 및 WebP 변환
    const bytes = await file.arrayBuffer()
    const inputBuffer = Buffer.from(bytes)

    let outputBuffer: Buffer
    let thumbBuffer: Buffer
    let outputFilename: string
    const thumbFilename = `${timestamp}-${random}-thumb.webp`

    if (file.type === 'image/gif') {
      // GIF는 애니메이션 유지
      outputBuffer = await sharp(inputBuffer, { animated: true })
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .gif()
        .toBuffer()
      outputFilename = `${timestamp}-${random}.gif`
      // GIF 썸네일은 첫 프레임만 WebP로 변환
      thumbBuffer = await sharp(inputBuffer, { animated: false })
        .resize({ width: THUMB_SIZE, height: THUMB_SIZE, fit: 'cover' })
        .webp({ quality: THUMB_QUALITY })
        .toBuffer()
    } else {
      // 나머지는 WebP로 변환 + 리사이징
      outputBuffer = await sharp(inputBuffer)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer()
      outputFilename = `${timestamp}-${random}.webp`
      // 썸네일 생성 (정사각형, 중앙 크롭)
      thumbBuffer = await sharp(inputBuffer)
        .resize({ width: THUMB_SIZE, height: THUMB_SIZE, fit: 'cover' })
        .webp({ quality: THUMB_QUALITY })
        .toBuffer()
    }

    // 원본 파일 저장
    const filePath = path.join(uploadDir, outputFilename)
    await sharp(outputBuffer).toFile(filePath)

    // 썸네일 파일 저장
    const thumbPath = path.join(uploadDir, thumbFilename)
    await sharp(thumbBuffer).toFile(thumbPath)

    const imagePath = `${urlPath}/${outputFilename}`
    const thumbnailPath = `${urlPath}/${thumbFilename}`

    // DB 저장
    const photo = await prisma.galleryPhoto.create({
      data: {
        userId: user.id,
        title,
        description,
        imagePath,
        thumbnailPath,
      },
      select: {
        id: true,
      },
    })

    console.log(
      `갤러리 업로드: ${file.name} (${(file.size / 1024).toFixed(1)}KB) → ${outputFilename} (${(outputBuffer.length / 1024).toFixed(1)}KB), 썸네일: ${thumbFilename} (${(thumbBuffer.length / 1024).toFixed(1)}KB)`
    )

    return NextResponse.json({
      success: true,
      photo: { id: photo.id },
    })
  } catch (error) {
    console.error('갤러리 업로드 에러:', error)
    return NextResponse.json(
      { error: '사진 업로드에 실패했습니다.' },
      { status: 500 }
    )
  }
}

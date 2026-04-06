"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, ArrowRight, Heart } from "lucide-react"
import Link from "next/link"

interface Photo {
  id: number
  title: string
  thumbnailUrl: string
  likeCount: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function RecentPhotos({ settings }: { settings?: Record<string, any> }) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const limit = settings?.limit || 8

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await fetch(`/api/photo-gallery?limit=${limit}`)
        if (res.ok) {
          const data = await res.json()
          setPhotos(data.photos || [])
        }
      } catch (error) {
        console.error('RecentPhotos 데이터 조회 에러:', error)
      }
    }
    fetchPhotos()
  }, [limit])

  return (
    <Card className="h-full">
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          최근 사진
        </h2>
        <Link href="/photo-gallery" className="text-sm text-primary hover:underline flex items-center gap-1">
          더보기 <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <CardContent className="p-4">
        {photos.length > 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {photos.map((photo) => (
              <Link
                key={photo.id}
                href={`/photo-gallery/${photo.id}`}
                className="relative aspect-square rounded overflow-hidden group"
              >
                <img
                  src={photo.thumbnailUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
                {photo.likeCount > 0 && (
                  <span className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Heart className="h-3 w-3" />
                    {photo.likeCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            아직 사진이 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import Link from "next/link"
import { Heart, Eye, ImageIcon } from "lucide-react"

interface PhotoCardProps {
  id: number
  title: string
  thumbnailPath: string | null
  imagePath: string
  likeCount: number
  viewCount: number
  user: { nickname: string }
}

export function PhotoCard({ id, title, thumbnailPath, imagePath, likeCount, viewCount, user }: PhotoCardProps) {
  const src = thumbnailPath || imagePath

  return (
    <Link
      href={`/photo-gallery/${id}`}
      className="group block border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-card"
    >
      <div className="aspect-square bg-muted relative overflow-hidden">
        {src ? (
          <img
            src={src}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <div className="p-3 space-y-1">
        <h3 className="font-medium text-sm line-clamp-1">{title}</h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{user.nickname}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {likeCount}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {viewCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

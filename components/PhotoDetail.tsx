"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { PhotoReactions } from "./PhotoReactions"
import { ArrowLeft, Eye, Calendar, Trash2, Loader2, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { UserLayout } from "@/components/layout/UserLayout"

interface Photo {
  id: number
  title: string
  description: string | null
  imagePath: string
  thumbnailPath: string | null
  viewCount: number
  likeCount: number
  createdAt: string
  author: { id: number; nickname: string }
}

interface PhotoDetailProps {
  photoId: number
}

export default function PhotoDetail({ photoId }: PhotoDetailProps) {
  const router = useRouter()
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState("")

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user) {
          setIsLoggedIn(true)
          setCurrentUserId(d.user.id)
          setCurrentUserRole(d.user.role || "")
        }
      })
      .catch(() => {})
  }, [])

  const fetchPhoto = useCallback(async () => {
    try {
      const res = await fetch(`/api/photo-gallery/${photoId}`)
      if (!res.ok) {
        setError("사진을 찾을 수 없습니다.")
        return
      }
      const data = await res.json()
      setPhoto(data.photo)
    } catch {
      setError("사진을 불러오는 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }, [photoId])

  useEffect(() => {
    fetchPhoto()
  }, [fetchPhoto])

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/photo-gallery/${photoId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        router.push("/photo-gallery")
      } else {
        const data = await res.json()
        alert(data.error || "삭제에 실패했습니다.")
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.")
    } finally {
      setDeleting(false)
    }
  }

  const canDelete =
    photo &&
    (currentUserId === photo.author.id ||
      currentUserRole === "admin" ||
      currentUserRole === "manager")

  if (loading) {
    return (
      <UserLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/4" />
            <div className="h-[60vh] bg-muted rounded" />
            <div className="h-8 bg-muted rounded w-1/2" />
          </div>
        </div>
      </UserLayout>
    )
  }

  if (error || !photo) {
    return (
      <UserLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">{error || "사진을 찾을 수 없습니다."}</p>
          <Link href="/photo-gallery" className="text-primary mt-4 inline-block hover:underline">
            갤러리로 돌아가기
          </Link>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 상단 네비 */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/photo-gallery"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            갤러리로 돌아가기
          </Link>
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-1" />
                  삭제
                </>
              )}
            </Button>
          )}
        </div>

        {/* 이미지 */}
        <div className="bg-black rounded-lg overflow-hidden mb-6">
          <img
            src={photo.imagePath}
            alt={photo.title}
            className="w-full max-h-[70vh] object-contain mx-auto"
          />
        </div>

        {/* 정보 */}
        <div className="space-y-4">
          <h1 className="text-xl font-bold">{photo.title}</h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{photo.author.nickname}</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(photo.createdAt).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {photo.viewCount}
            </span>
          </div>

          {photo.description && (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {photo.description}
            </p>
          )}

          {/* 리액션 */}
          <div className="pt-4 border-t border-border">
            <PhotoReactions photoId={photo.id} isLoggedIn={isLoggedIn} />
          </div>
        </div>
      </div>
    </UserLayout>
  )
}

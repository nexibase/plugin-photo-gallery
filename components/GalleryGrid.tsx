"use client"

import { useState, useEffect, useCallback } from "react"
import { PhotoCard } from "./PhotoCard"
import { Input } from "@/components/ui/input"
import { Camera, Search, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { UserLayout } from "@/components/layout/UserLayout"

interface Photo {
  id: number
  title: string
  thumbnailPath: string | null
  imagePath: string
  likeCount: number
  viewCount: number
  user: { nickname: string }
}

export default function GalleryGrid() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sort, setSort] = useState<"latest" | "popular">("latest")
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user) setIsLoggedIn(true)
      })
      .catch(() => {})
  }, [])

  const fetchPhotos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        sort,
        ...(search && { search }),
      })

      const res = await fetch(`/api/photo-gallery?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPhotos(data.photos || [])
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error("사진 목록 조회 에러:", error)
    } finally {
      setLoading(false)
    }
  }, [page, sort, search])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const handleSortChange = (newSort: "latest" | "popular") => {
    setSort(newSort)
    setPage(1)
  }

  return (
    <UserLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Camera className="w-6 h-6" />
            <h1 className="text-2xl font-bold">사진 갤러리</h1>
          </div>
          {isLoggedIn && (
            <Link
              href="/photo-gallery/upload"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              사진 올리기
            </Link>
          )}
        </div>

        {/* 검색 + 정렬 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="사진 검색..."
              className="pl-9"
            />
          </form>
          <div className="flex gap-1">
            <button
              onClick={() => handleSortChange("latest")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                sort === "latest"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              최신
            </button>
            <button
              onClick={() => handleSortChange("popular")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                sort === "popular"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              인기
            </button>
          </div>
        </div>

        {/* 그리드 */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="border border-border rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Camera className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>아직 사진이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <PhotoCard key={photo.id} {...photo} />
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 border border-border rounded-md hover:bg-muted disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-muted-foreground px-4">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 border border-border rounded-md hover:bg-muted disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </UserLayout>
  )
}

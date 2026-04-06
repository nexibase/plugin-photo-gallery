"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/admin/Sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Search,
  Trash2,
  Loader2,
  Camera,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  ExternalLink,
} from "lucide-react"

interface Photo {
  id: number
  title: string
  description: string | null
  imagePath: string
  thumbnailPath: string | null
  likeCount: number
  viewCount: number
  createdAt: string
  author: {
    id: number
    nickname: string
  }
  selected?: boolean
}

export default function PhotoGalleryAdminPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleting, setDeleting] = useState(false)

  const fetchPhotos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      })
      if (search) params.set("search", search)

      const res = await fetch(`/api/admin/photo-gallery?${params}`)
      const data = await res.json()

      setPhotos(data.photos?.map((p: Photo) => ({ ...p, selected: false })) || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
    } catch (error) {
      console.error("포토갤러리 목록 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchPhotos()
  }

  const toggleSelect = (id: number) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    )
  }

  const toggleSelectAll = () => {
    const allSelected = photos.every((p) => p.selected)
    setPhotos((prev) => prev.map((p) => ({ ...p, selected: !allSelected })))
  }

  const selectedIds = photos.filter((p) => p.selected).map((p) => p.id)

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`선택한 ${selectedIds.length}개의 사진을 삭제하시겠습니까?`)) return

    setDeleting(true)
    try {
      const res = await fetch("/api/admin/photo-gallery", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      })

      if (res.ok) {
        fetchPhotos()
      }
    } catch (error) {
      console.error("일괄 삭제 실패:", error)
    } finally {
      setDeleting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("이 사진을 삭제하시겠습니까?")) return

    try {
      const res = await fetch(`/api/admin/photo-gallery/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        fetchPhotos()
      }
    } catch (error) {
      console.error("삭제 실패:", error)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* 헤더 */}
          <div>
            <h1 className="text-2xl font-bold">포토갤러리 관리</h1>
            <p className="text-muted-foreground mt-1">
              업로드된 사진을 관리합니다.
            </p>
          </div>

          {/* 통계 카드 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                전체 사진
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{total}</span>
              </div>
            </CardContent>
          </Card>

          {/* 검색 + 일괄삭제 */}
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="제목 또는 작성자 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="outline">
                검색
              </Button>
            </form>

            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {selectedIds.length}개 삭제
              </Button>
            )}
          </div>

          {/* 테이블 */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={photos.length > 0 && photos.every((p) => p.selected)}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-muted-foreground w-16">
                    썸네일
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-muted-foreground">
                    제목
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-muted-foreground w-24">
                    작성자
                  </th>
                  <th className="p-3 text-center text-sm font-medium text-muted-foreground w-20">
                    <Eye className="h-4 w-4 inline" />
                  </th>
                  <th className="p-3 text-center text-sm font-medium text-muted-foreground w-20">
                    <Heart className="h-4 w-4 inline" />
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-muted-foreground w-28">
                    등록일
                  </th>
                  <th className="p-3 text-center text-sm font-medium text-muted-foreground w-20">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : photos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-12 text-center text-muted-foreground"
                    >
                      등록된 사진이 없습니다.
                    </td>
                  </tr>
                ) : (
                  photos.map((photo) => (
                    <tr
                      key={photo.id}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={photo.selected || false}
                          onChange={() => toggleSelect(photo.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="p-3">
                        <img
                          src={photo.thumbnailPath || photo.imagePath}
                          alt={photo.title}
                          className="w-10 h-10 rounded object-cover"
                        />
                      </td>
                      <td className="p-3">
                        <a
                          href={`/photo-gallery/${photo.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:underline inline-flex items-center gap-1"
                        >
                          {photo.title}
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </a>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {photo.author?.nickname || "-"}
                      </td>
                      <td className="p-3 text-center text-sm text-muted-foreground">
                        {photo.viewCount}
                      </td>
                      <td className="p-3 text-center text-sm text-muted-foreground">
                        {photo.likeCount}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {formatDate(photo.createdAt)}
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(photo.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

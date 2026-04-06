"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, X, ImageIcon } from "lucide-react"

export function PhotoUploadForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFileSelect = (file: File | null) => {
    if (!file) return

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      setError("지원하지 않는 파일 형식입니다. (jpeg, png, gif, webp)")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("파일 크기는 5MB 이하여야 합니다.")
      return
    }

    setError("")
    setImageFile(file)

    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleClearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setError("제목을 입력해주세요.")
      return
    }
    if (!imageFile) {
      setError("이미지를 선택해주세요.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("title", title.trim())
      formData.append("description", description.trim())
      formData.append("image", imageFile)

      const res = await fetch("/api/photo-gallery", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "업로드에 실패했습니다.")
        return
      }

      router.push(`/photo-gallery/${data.photo.id}`)
    } catch {
      setError("네트워크 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">제목 *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="사진 제목을 입력해주세요"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">설명</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="사진에 대한 설명을 입력해주세요 (선택)"
          rows={4}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm resize-y"
        />
      </div>

      <div className="space-y-2">
        <Label>이미지 *</Label>
        {imagePreview ? (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="미리보기"
              className="max-h-64 rounded-lg border border-border"
            />
            <button
              type="button"
              onClick={handleClearImage}
              className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground"
            }`}
          >
            <Upload className="w-8 h-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">클릭하거나 이미지를 드래그하세요</p>
              <p className="text-xs text-muted-foreground mt-1">
                jpeg, png, gif, webp / 최대 5MB
              </p>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          className="hidden"
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            업로드 중...
          </>
        ) : (
          "사진 올리기"
        )}
      </Button>
    </form>
  )
}

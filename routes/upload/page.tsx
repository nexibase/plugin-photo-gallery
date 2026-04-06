"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PhotoUploadForm } from "@/plugins/photo-gallery/components/PhotoUploadForm"
import { Camera, Loader2 } from "lucide-react"
import { UserLayout } from "@/components/layout/UserLayout"

export default function UploadPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (!d?.user) {
          router.replace("/login?redirect=/photo-gallery/upload")
        } else {
          setChecking(false)
        }
      })
      .catch(() => {
        router.replace("/login?redirect=/photo-gallery/upload")
      })
  }, [router])

  if (checking) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Camera className="w-6 h-6" />
          <h1 className="text-2xl font-bold">사진 업로드</h1>
        </div>
        <div className="border border-border rounded-lg bg-card p-6">
          <PhotoUploadForm />
        </div>
      </div>
    </UserLayout>
  )
}

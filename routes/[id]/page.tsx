"use client"

import { use } from "react"
import PhotoDetail from "@/plugins/photo-gallery/components/PhotoDetail"

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <PhotoDetail photoId={parseInt(id)} />
}

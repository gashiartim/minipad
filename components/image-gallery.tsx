"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Images } from "lucide-react"

interface Image {
  id: string
  path: string
  mime: string
  width: number | null
  height: number | null
  sizeBytes: number
  createdAt: string
}

interface ImageGalleryProps {
  images: Image[]
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Images className="h-5 w-5" />
          Images ({images.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-video bg-muted flex items-center justify-center">
                <Image
                  src={`/i/${image.path}`}
                  alt="Uploaded image"
                  width={800}
                  height={450}
                  unoptimized
                  className="max-w-full max-h-full object-contain cursor-pointer"
                  onClick={() => window.open(`/i/${image.path}`, "_blank")}
                />
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {image.mime.split("/")[1]?.toUpperCase() || "UNKNOWN"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatFileSize(image.sizeBytes)}</span>
                </div>
                {image.width && image.height && (
                  <p className="text-xs text-muted-foreground">
                    {image.width} × {image.height}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{new Date(image.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

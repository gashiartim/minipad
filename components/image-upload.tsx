"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileImage, AlertCircle } from "lucide-react"

interface ImageUploadProps {
  slug: string
  secret: string
  onImageUploaded: (image: any) => void
}

export function ImageUpload({ slug, secret, onImageUploaded }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PNG, JPEG, WebP, or GIF images only",
        variant: "destructive",
      })
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload images smaller than 10MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", file)
      if (secret) {
        formData.append("secret", secret)
      }

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + Math.random() * 30, 90))
      }, 200)

      const response = await fetch(`/api/notes/${slug}/images`, {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Upload failed",
          description: data.error || "Failed to upload image",
          variant: "destructive",
        })
        return
      }

      onImageUploaded(data)
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Images
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
            isDragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/20"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="space-y-4">
              <FileImage className="h-12 w-12 mx-auto text-primary animate-pulse" />
              <div className="space-y-2">
                <p className="font-medium">Uploading image...</p>
                <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                <p className="text-sm text-muted-foreground">{Math.round(uploadProgress)}% complete</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`transition-transform duration-200 ${isDragging ? "scale-110" : ""}`}>
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium">{isDragging ? "Drop image here" : "Drop images here"}</p>
                <p className="text-sm text-muted-foreground">or click to select files</p>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="transition-all hover:scale-105"
              >
                <FileImage className="h-4 w-4 mr-2" />
                Select Files
              </Button>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3" />
                <span>PNG, JPEG, WebP, GIF • Max 10MB</span>
              </div>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </CardContent>
    </Card>
  )
}

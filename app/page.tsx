"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function HomePage() {
  const [slug, setSlug] = useState("")
  const [secret, setSecret] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleCreate = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim() || undefined,
          secret: secret.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to create note",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Note created successfully",
      })

      router.push(`/${data.slug}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpen = () => {
    if (!slug.trim()) {
      toast({
        title: "Error",
        description: "Please enter a slug",
        variant: "destructive",
      })
      return
    }
    router.push(`/${slug.trim()}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleCreate()
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Local Notepad</CardTitle>
          <CardDescription>Create or open notes by slug. Notes are stored locally.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slug">Note Slug</Label>
            <Input
              id="slug"
              placeholder="my-note (optional for create)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              onKeyDown={handleKeyDown}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">3-64 characters: letters, numbers, hyphens, underscores</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret">Secret (optional)</Label>
            <Input
              id="secret"
              type="password"
              placeholder="6-128 characters"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <p className="text-xs text-muted-foreground">If set, required for editing and uploading images</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={isLoading} className="flex-1">
              {isLoading ? "Creating..." : "Create"}
            </Button>
            <Button onClick={handleOpen} variant="outline" disabled={!slug.trim()} className="flex-1 bg-transparent">
              Open
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">Press Ctrl/Cmd+Enter to create</p>
        </CardContent>
      </Card>
    </div>
  )
}

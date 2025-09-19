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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 animate-in slide-in-from-top-4 duration-700">
          <h1 className="text-4xl font-bold tracking-tight">Local Notepad</h1>
          <p className="text-muted-foreground">Create rich text notes with real-time collaboration</p>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg bg-card/95 backdrop-blur animate-in slide-in-from-bottom-4 duration-700 delay-200">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-sm font-medium">Note Name</Label>
                <Input
                  id="slug"
                  placeholder="Enter note name or leave blank to generate"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-11 border-border/50 focus:border-primary transition-colors"
                />
                <p className="text-xs text-muted-foreground">Letters, numbers, hyphens, and underscores only</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret" className="text-sm font-medium">Password Protection</Label>
                <Input
                  type="password"
                  id="secret"
                  placeholder="Optional: Add password protection"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-11 border-border/50 focus:border-primary transition-colors"
                />
                <p className="text-xs text-muted-foreground">Protects editing and image uploads</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleCreate} 
                disabled={isLoading} 
                className="w-full h-11 font-medium transition-all duration-200 hover:scale-[1.02] focus:ring-2 focus:ring-primary focus:ring-offset-2"
                size="lg"
                aria-label={isLoading ? "Creating note..." : "Create a new note"}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                    Creating Note...
                  </div>
                ) : (
                  "Create New Note"
                )}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">OR</span>
                </div>
              </div>

              <Button 
                onClick={handleOpen} 
                variant="outline" 
                disabled={!slug.trim() || isLoading} 
                className="w-full h-11 font-medium border-border/50 hover:border-primary transition-all duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                size="lg"
                aria-label="Open existing note with the name you entered"
              >
                Open Existing Note
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">⌘ Enter</kbd> to create
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 text-center animate-in slide-in-from-bottom-4 duration-700 delay-500">
          <div className="space-y-2 transition-transform hover:scale-105 duration-200">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mx-auto transition-colors hover:bg-primary/20">
              <span className="text-lg">✨</span>
            </div>
            <p className="text-xs text-muted-foreground">Rich Text Editor</p>
          </div>
          <div className="space-y-2 transition-transform hover:scale-105 duration-200">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mx-auto transition-colors hover:bg-primary/20">
              <span className="text-lg">🔄</span>
            </div>
            <p className="text-xs text-muted-foreground">Real-time Sync</p>
          </div>
        </div>
      </div>
    </div>
  )
}

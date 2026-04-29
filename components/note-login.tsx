"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Home } from "lucide-react"
import { useRouter } from "next/navigation"

interface NoteLoginProps {
  slug: string
  onAuth: (secret: string) => void
  isLoading?: boolean
  error?: string
}

export function NoteLogin({ slug, onAuth, isLoading, error }: NoteLoginProps) {
  const [secret, setSecret] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!secret.trim()) return

    setIsVerifying(true)
    try {
      onAuth(secret.trim())
    } finally {
      setIsVerifying(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (!secret.trim()) return
      onAuth(secret.trim())
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">Protected Note</CardTitle>
          <CardDescription>
            The note <span className="font-mono font-medium">{slug}</span> is protected.
            <br />
            Enter the secret to access it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secret">Secret</Label>
              <Input
                id="secret"
                type="password"
                placeholder="Enter secret"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isVerifying || isLoading}
                autoFocus
                className={error ? "border-destructive" : ""}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={!secret.trim() || isVerifying || isLoading}
                className="flex-1"
              >
                {isVerifying ? "Verifying..." : "Access Note"}
              </Button>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => router.push("/")}
                disabled={isVerifying || isLoading}
              >
                <Home className="h-4 w-4" />
              </Button>
            </div>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            Press Enter to verify
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface StepProfileProps {
  onNext: (data: any) => void
  onBack: () => void
}

export function StepProfile({ onNext }: StepProfileProps) {
  const [avatar, setAvatar] = useState("")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    onNext(Object.fromEntries(formData))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center gap-4 pb-6 border-b">
        <Avatar className="w-24 h-24">
          <AvatarImage src={avatar || "/placeholder.svg"} />
          <AvatarFallback className="text-2xl">JD</AvatarFallback>
        </Avatar>
        <Button type="button" variant="outline" size="sm">
          Changer la photo
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom *</Label>
          <Input id="firstName" name="firstName" required placeholder="Jean" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom *</Label>
          <Input id="lastName" name="lastName" required placeholder="Dupont" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" placeholder="Parlez-nous un peu de vous..." className="min-h-24 resize-none" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Localisation</Label>
        <Input id="location" name="location" placeholder="Paris, France" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="linkedin">LinkedIn (optionnel)</Label>
        <Input id="linkedin" name="linkedin" type="url" placeholder="https://linkedin.com/in/..." />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          Continuer
        </Button>
      </div>
    </form>
  )
}

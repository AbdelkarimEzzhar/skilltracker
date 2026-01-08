"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

export function AddSkillForm() {
  const [level, setLevel] = useState([50])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Handle form submission
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="skillName">Nom de la compétence *</Label>
        <Input id="skillName" placeholder="Ex: React, Leadership..." required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Catégorie *</Label>
        <Select required>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="technical">Technique</SelectItem>
            <SelectItem value="soft">Soft Skills</SelectItem>
            <SelectItem value="language">Langue</SelectItem>
            <SelectItem value="tool">Outil</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Niveau de maîtrise</Label>
        <Slider value={level} onValueChange={setLevel} max={100} step={1} className="w-full" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Débutant</span>
          <span className="font-medium text-foreground">{level[0]}%</span>
          <span>Expert</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="source">Source de validation (optionnel)</Label>
        <Input id="source" placeholder="Ex: Certification, Projet, Formation..." />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1">
          Ajouter
        </Button>
      </div>
    </form>
  )
}

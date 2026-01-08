"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StepEducationProps {
  onNext: (data: any) => void
  onBack: () => void
}

export function StepEducation({ onNext, onBack }: StepEducationProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    onNext(Object.fromEntries(formData))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="institution">Établissement *</Label>
        <Input id="institution" name="institution" required placeholder="Université Paris-Saclay" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="degree">Diplôme *</Label>
        <Select name="degree" required>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner votre niveau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bac">Baccalauréat</SelectItem>
            <SelectItem value="bac+2">Bac+2 (BTS, DUT, DEUST)</SelectItem>
            <SelectItem value="licence">Licence (Bac+3)</SelectItem>
            <SelectItem value="master">Master (Bac+5)</SelectItem>
            <SelectItem value="doctorat">Doctorat (Bac+8)</SelectItem>
            <SelectItem value="other">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="field">Domaine d'étude *</Label>
        <Input id="field" name="field" required placeholder="Informatique, Gestion, Médecine..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startYear">Année de début *</Label>
          <Select name="startYear" required>
            <SelectTrigger>
              <SelectValue placeholder="2020" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => 2024 - i).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="endYear">Année de fin *</Label>
          <Select name="endYear" required>
            <SelectTrigger>
              <SelectValue placeholder="2024" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">En cours</SelectItem>
              {Array.from({ length: 10 }, (_, i) => 2024 + i).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1 bg-transparent">
          Retour
        </Button>
        <Button type="submit" className="flex-1">
          Continuer
        </Button>
      </div>
    </form>
  )
}

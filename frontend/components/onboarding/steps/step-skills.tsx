"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface StepSkillsProps {
  onNext: (data: any) => void
  onBack: () => void
}

const suggestedSkills = [
  "Python",
  "JavaScript",
  "React",
  "Leadership",
  "Communication",
  "Gestion de projet",
  "Design thinking",
  "Data analysis",
  "Marketing digital",
  "Photoshop",
]

export function StepSkills({ onNext, onBack }: StepSkillsProps) {
  const [skills, setSkills] = useState<string[]>([])
  const [inputValue, setInputValue] = useState("")

  const addSkill = (skill: string) => {
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill])
      setInputValue("")
    }
  }

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onNext({ skills })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="skill-input">Ajoutez vos compétences</Label>
          <div className="flex gap-2">
            <Input
              id="skill-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addSkill(inputValue)
                }
              }}
              placeholder="Ex: Python, Leadership..."
            />
            <Button type="button" onClick={() => addSkill(inputValue)} disabled={!inputValue}>
              Ajouter
            </Button>
          </div>
        </div>

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg">
            {skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="pl-3 pr-2 py-1.5 text-sm">
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="ml-2 hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label>Suggestions</Label>
        <div className="flex flex-wrap gap-2">
          {suggestedSkills
            .filter((skill) => !skills.includes(skill))
            .map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => addSkill(skill)}
              >
                + {skill}
              </Badge>
            ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1 bg-transparent">
          Retour
        </Button>
        <Button type="submit" className="flex-1" disabled={skills.length === 0}>
          Continuer
        </Button>
      </div>
    </form>
  )
}

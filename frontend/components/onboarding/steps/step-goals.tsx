"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface StepGoalsProps {
  onNext: (data: any) => void
  onBack: () => void
}

const goals = [
  { id: "job", label: "Trouver un emploi", icon: "💼" },
  { id: "internship", label: "Décrocher un stage", icon: "🎯" },
  { id: "skills", label: "Développer mes compétences", icon: "📚" },
  { id: "network", label: "Élargir mon réseau", icon: "🤝" },
  { id: "project", label: "Réaliser un projet", icon: "🚀" },
  { id: "certification", label: "Obtenir une certification", icon: "🏆" },
]

export function StepGoals({ onNext, onBack }: StepGoalsProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    onNext({
      ...Object.fromEntries(formData),
      goals: selectedGoals,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Label>Quels sont vos objectifs principaux ? *</Label>
        <div className="grid grid-cols-2 gap-3">
          {goals.map((goal) => (
            <button
              key={goal.id}
              type="button"
              onClick={() => toggleGoal(goal.id)}
              className={cn(
                "p-4 rounded-lg border-2 transition-all text-left hover:scale-105",
                selectedGoals.includes(goal.id)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
              )}
            >
              <div className="text-2xl mb-2">{goal.icon}</div>
              <div className="font-medium text-sm">{goal.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeline">Dans combien de temps ? *</Label>
        <select
          id="timeline"
          name="timeline"
          required
          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Sélectionner...</option>
          <option value="3months">Dans les 3 prochains mois</option>
          <option value="6months">Dans les 6 prochains mois</option>
          <option value="1year">Dans l'année</option>
          <option value="flexible">Flexible</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="details">Détails (optionnel)</Label>
        <Textarea
          id="details"
          name="details"
          placeholder="Décrivez plus en détail vos objectifs..."
          className="min-h-24 resize-none"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1 bg-transparent">
          Retour
        </Button>
        <Button type="submit" className="flex-1" disabled={selectedGoals.length === 0}>
          Continuer
        </Button>
      </div>
    </form>
  )
}

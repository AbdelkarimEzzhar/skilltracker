"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"

interface StepPreferencesProps {
  onNext: (data: any) => void
  onBack: () => void
}

export function StepPreferences({ onNext, onBack }: StepPreferencesProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    onNext(Object.fromEntries(formData))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex-1">
            <Label>Notifications email</Label>
            <p className="text-sm text-muted-foreground">Recevoir des mises à jour sur votre progression</p>
          </div>
          <Switch name="emailNotifications" defaultChecked />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex-1">
            <Label>Recommandations IA</Label>
            <p className="text-sm text-muted-foreground">Suggestions personnalisées de formations</p>
          </div>
          <Switch name="aiRecommendations" defaultChecked />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex-1">
            <Label>Rappels hebdomadaires</Label>
            <p className="text-sm text-muted-foreground">Rappel de vos objectifs chaque semaine</p>
          </div>
          <Switch name="weeklyReminders" defaultChecked />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex-1">
            <Label>Profil public</Label>
            <p className="text-sm text-muted-foreground">Rendre votre profil visible aux recruteurs</p>
          </div>
          <Switch name="publicProfile" />
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <Label>Temps d'apprentissage souhaité par semaine</Label>
        <div className="space-y-2">
          <Slider name="weeklyHours" defaultValue={[5]} max={20} step={1} className="w-full" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>1h</span>
            <span>10h</span>
            <span>20h</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1 bg-transparent">
          Retour
        </Button>
        <Button type="submit" className="flex-1">
          Terminer
        </Button>
      </div>
    </form>
  )
}

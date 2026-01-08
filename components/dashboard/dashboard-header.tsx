"use client"

import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { StreakWidget } from "@/components/gamification/streak-widget"
import { LevelProgress } from "@/components/gamification/level-progress"

export function DashboardHeader() {
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? "Bonjour" : currentHour < 18 ? "Bon après-midi" : "Bonsoir"

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            {greeting}, Jean
            <span className="inline-block ml-2 animate-wave origin-[70%_70%]">👋</span>
          </h1>
          <p className="text-muted-foreground">Voici un aperçu de votre progression aujourd'hui</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." className="pl-9 w-64" />
          </div>
          <Button variant="outline" size="icon" className="relative bg-transparent">
            <Bell className="w-5 h-5" />
            <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs">3</Badge>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LevelProgress />
        <StreakWidget />
      </div>
    </div>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { Target, Share2 } from "lucide-react"

export function RoadmapHeader() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold mb-1">Roadmap carrière</h1>
        <p className="text-muted-foreground">Votre plan personnalisé vers vos objectifs professionnels</p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" className="bg-transparent">
          <Share2 className="w-4 h-4 mr-2" />
          Partager
        </Button>
        <Button>
          <Target className="w-4 h-4 mr-2" />
          Ajuster mes objectifs
        </Button>
      </div>
    </div>
  )
}

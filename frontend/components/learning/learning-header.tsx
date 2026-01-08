"use client"

import { Button } from "@/components/ui/button"
import { Plus, Filter } from "lucide-react"

export function LearningHeader() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold mb-1">Mes formations</h1>
        <p className="text-muted-foreground">Suivez vos cours et formations en cours</p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" className="bg-transparent">
          <Filter className="w-4 h-4 mr-2" />
          Filtrer
        </Button>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une formation
        </Button>
      </div>
    </div>
  )
}

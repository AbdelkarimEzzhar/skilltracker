"use client"

import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"

export function AcademicHeader() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold mb-1">Parcours académique</h1>
        <p className="text-muted-foreground">Votre historique éducatif et vos cours en cours</p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" className="bg-transparent">
          <Download className="w-4 h-4 mr-2" />
          Télécharger le relevé
        </Button>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un cours
        </Button>
      </div>
    </div>
  )
}

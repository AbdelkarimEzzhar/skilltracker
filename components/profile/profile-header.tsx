"use client"

import { Button } from "@/components/ui/button"
import { Share2, Download } from "lucide-react"

export function ProfileHeader() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold mb-1">Mon profil</h1>
        <p className="text-muted-foreground">Gérez vos informations personnelles et professionnelles</p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" className="bg-transparent">
          <Share2 className="w-4 h-4 mr-2" />
          Partager
        </Button>
        <Button variant="outline" className="bg-transparent">
          <Download className="w-4 h-4 mr-2" />
          Export CV
        </Button>
      </div>
    </div>
  )
}

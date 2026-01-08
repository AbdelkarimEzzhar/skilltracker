"use client"

import { Button } from "@/components/ui/button"
import { Sparkles, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function RecommendationsHeader() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">Recommandations IA</h1>
          <Badge className="bg-primary">
            <Sparkles className="w-3 h-3 mr-1" />
            Personnalisé
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Formations et contenus adaptés à votre profil et vos objectifs professionnels
        </p>
      </div>

      <Button variant="outline" className="bg-transparent">
        <RefreshCw className="w-4 h-4 mr-2" />
        Actualiser
      </Button>
    </div>
  )
}

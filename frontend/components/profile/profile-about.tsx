"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"

export function ProfileAbout() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>À propos</CardTitle>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed">
          Étudiant passionné en informatique avec une forte affinité pour le développement web moderne. Actuellement en
          Master 2, je me spécialise dans les technologies React, TypeScript et Node.js. Mon objectif est de devenir
          développeur Full-Stack dans une startup innovante où je pourrai contribuer à des projets ambitieux tout en
          continuant à apprendre et à évoluer.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="bg-transparent">
            Développement Web
          </Button>
          <Button size="sm" variant="outline" className="bg-transparent">
            React & TypeScript
          </Button>
          <Button size="sm" variant="outline" className="bg-transparent">
            Travail d'équipe
          </Button>
          <Button size="sm" variant="outline" className="bg-transparent">
            Résolution de problèmes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

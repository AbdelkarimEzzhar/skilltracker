"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Plus, Briefcase } from "lucide-react"

const experiences = [
  {
    id: 1,
    title: "Développeur Frontend - Stage",
    company: "TechCorp",
    period: "Juin 2024 - Août 2024",
    description:
      "Développement d'une application React pour la gestion interne. Collaboration avec une équipe de 5 développeurs. Implémentation de nouvelles fonctionnalités et correction de bugs.",
  },
  {
    id: 2,
    title: "Développeur Web - Freelance",
    company: "Projets personnels",
    period: "Jan 2023 - Mai 2024",
    description:
      "Création de sites web pour des petites entreprises locales. Technologies utilisées: React, Node.js, MongoDB. Gestion complète des projets de la conception au déploiement.",
  },
]

export function ProfileExperience() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Expérience professionnelle</CardTitle>
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {experiences.map((exp) => (
          <div key={exp.id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
            <div className="p-2 rounded-lg bg-muted h-fit">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold">{exp.title}</h3>
                  <p className="text-sm text-muted-foreground">{exp.company}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0">
                  <Edit className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{exp.period}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{exp.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

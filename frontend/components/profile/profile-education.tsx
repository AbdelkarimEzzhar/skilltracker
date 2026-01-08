"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Plus, GraduationCap } from "lucide-react"

const education = [
  {
    id: 1,
    degree: "Master 2 - Informatique",
    institution: "Université Paris-Saclay",
    period: "2024 - 2025",
    status: "En cours",
    grade: "En cours",
  },
  {
    id: 2,
    degree: "Master 1 - Informatique",
    institution: "Université Paris-Saclay",
    period: "2023 - 2024",
    status: "Complété",
    grade: "16.2/20",
  },
  {
    id: 3,
    degree: "Licence - Informatique",
    institution: "Université Paris-Saclay",
    period: "2020 - 2023",
    status: "Complété",
    grade: "15.3/20",
  },
]

export function ProfileEducation() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Formation académique</CardTitle>
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {education.map((edu) => (
          <div key={edu.id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
            <div className="p-2 rounded-lg bg-muted h-fit">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold">{edu.degree}</h3>
                  <p className="text-sm text-muted-foreground">{edu.institution}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0">
                  <Edit className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs text-muted-foreground">{edu.period}</p>
                {edu.status === "En cours" ? (
                  <Badge className="text-xs bg-primary">En cours</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                    Complété
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium">Note: {edu.grade}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

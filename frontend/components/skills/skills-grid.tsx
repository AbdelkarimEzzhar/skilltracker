"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SkillCard } from "./skill-card"

const skills = {
  technical: [
    { id: 1, name: "React", level: 85, category: "Frontend", verified: true, trending: "up" },
    { id: 2, name: "TypeScript", level: 78, category: "Language", verified: true, trending: "up" },
    { id: 3, name: "Node.js", level: 72, category: "Backend", verified: false, trending: "stable" },
    { id: 4, name: "Python", level: 65, category: "Language", verified: true, trending: "up" },
    { id: 5, name: "SQL", level: 70, category: "Database", verified: false, trending: "stable" },
    { id: 6, name: "Git", level: 80, category: "Tool", verified: true, trending: "stable" },
  ],
  soft: [
    { id: 7, name: "Leadership", level: 75, category: "Management", verified: false, trending: "up" },
    { id: 8, name: "Communication", level: 82, category: "Interpersonal", verified: true, trending: "stable" },
    { id: 9, name: "Gestion de projet", level: 68, category: "Management", verified: false, trending: "up" },
    { id: 10, name: "Travail d'équipe", level: 88, category: "Interpersonal", verified: true, trending: "stable" },
    { id: 11, name: "Résolution de problèmes", level: 77, category: "Analytical", verified: false, trending: "up" },
    { id: 12, name: "Créativité", level: 70, category: "Soft", verified: false, trending: "stable" },
  ],
  all: [],
}

skills.all = [...skills.technical, ...skills.soft]

export function SkillsGrid() {
  const [filter, setFilter] = useState("all")

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Portfolio de compétences</CardTitle>
        <CardDescription>Visualisez et gérez toutes vos compétences</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Toutes ({skills.all.length})</TabsTrigger>
            <TabsTrigger value="technical">Techniques ({skills.technical.length})</TabsTrigger>
            <TabsTrigger value="soft">Transversales ({skills.soft.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.all.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </TabsContent>

          <TabsContent value="technical" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.technical.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </TabsContent>

          <TabsContent value="soft" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.soft.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

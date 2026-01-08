"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const radarData = [
  { skill: "Frontend", value: 85, fullMark: 100 },
  { skill: "Backend", value: 72, fullMark: 100 },
  { skill: "Database", value: 70, fullMark: 100 },
  { skill: "DevOps", value: 55, fullMark: 100 },
  { skill: "Design", value: 60, fullMark: 100 },
  { skill: "Management", value: 75, fullMark: 100 },
]

export function SkillsRadar() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Profil de compétences</CardTitle>
        <CardDescription>Vue d'ensemble de vos domaines d'expertise</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            value: {
              label: "Niveau",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="skill" tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }} />
              <Radar
                name="Niveau"
                dataKey="value"
                stroke="hsl(var(--chart-1))"
                fill="hsl(var(--chart-1))"
                fillOpacity={0.3}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="mt-6 space-y-3 pt-4 border-t">
          <h4 className="font-semibold text-sm">Recommandations</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <p className="text-muted-foreground leading-relaxed">
                Renforcez vos compétences DevOps pour un profil complet
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <p className="text-muted-foreground leading-relaxed">
                Excellente maîtrise du Frontend, continuez ainsi !
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const weeklyData = [
  { day: "Lun", hours: 2.5, skills: 2 },
  { day: "Mar", hours: 3.2, skills: 3 },
  { day: "Mer", hours: 1.8, skills: 1 },
  { day: "Jeu", hours: 4.1, skills: 4 },
  { day: "Ven", hours: 2.9, skills: 2 },
  { day: "Sam", hours: 5.2, skills: 5 },
  { day: "Dim", hours: 3.5, skills: 3 },
]

const skillCategories = [
  { name: "Développement Web", progress: 85, total: 12, completed: 10 },
  { name: "Gestion de projet", progress: 65, total: 8, completed: 5 },
  { name: "Communication", progress: 72, total: 10, completed: 7 },
  { name: "Data Science", progress: 45, total: 15, completed: 7 },
]

export function ProgressOverview() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Aperçu de votre progression</CardTitle>
        <CardDescription>Visualisez votre évolution cette semaine</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="activity">Activité hebdomadaire</TabsTrigger>
            <TabsTrigger value="skills">Compétences par domaine</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-4">
            <ChartContainer
              config={{
                hours: {
                  label: "Heures", // Added proper label to config
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            {skillCategories.map((category) => (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{category.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {category.completed}/{category.total} compétences
                  </span>
                </div>
                <Progress value={category.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">{category.progress}% complété</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

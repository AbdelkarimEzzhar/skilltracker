"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { name: "Complétées", value: 18, color: "hsl(var(--chart-2))" },
  { name: "En cours", value: 5, color: "hsl(var(--chart-1))" },
  { name: "Non commencées", value: 3, color: "hsl(var(--muted))" },
]

export function LearningProgress() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Aperçu global</CardTitle>
        <CardDescription>Répartition de vos formations</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            completed: {
              label: "Complétées",
              color: "hsl(var(--chart-2))",
            },
            inProgress: {
              label: "En cours",
              color: "hsl(var(--chart-1))",
            },
            notStarted: {
              label: "Non commencées",
              color: "hsl(var(--muted))",
            },
          }}
          className="h-[200px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="space-y-2 mt-4">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
              </div>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="text-center">
            <p className="text-3xl font-bold mb-1">69%</p>
            <p className="text-sm text-muted-foreground">Taux de complétion</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

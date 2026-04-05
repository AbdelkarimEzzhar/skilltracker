import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

const insights = [
  "Vous progressez 23% plus vite que la moyenne cette semaine !",
  "Continuez ainsi pour atteindre votre objectif mensuel.",
  "3 nouvelles formations correspondent à votre profil.",
]

export function WeeklyInsights() {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Insights IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
            <p className="text-sm leading-relaxed">{insight}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

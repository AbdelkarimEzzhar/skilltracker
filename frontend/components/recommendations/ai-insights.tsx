import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, TrendingUp, Target, Zap } from "lucide-react"

const insights = [
  {
    icon: Sparkles,
    title: "Profil en forte progression",
    description: "Vous progressez 35% plus vite que la moyenne dans les technologies frontend",
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
  },
  {
    icon: TrendingUp,
    title: "Opportunité détectée",
    description: "Le marché recherche activement des profils React + TypeScript comme le vôtre",
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
  {
    icon: Target,
    title: "Objectif à portée",
    description: "3 formations supplémentaires vous rapprochent de votre objectif Full-Stack",
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
  },
  {
    icon: Zap,
    title: "Recommandation urgente",
    description: "Apprenez Docker maintenant - compétence critique pour 87% des offres ciblées",
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
  },
]

export function AIInsights() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {insights.map((insight) => {
        const Icon = insight.icon
        return (
          <Card key={insight.title} className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className={`p-2.5 rounded-lg ${insight.bgColor} w-fit mb-3`}>
                <Icon className={`w-5 h-5 ${insight.color}`} />
              </div>
              <h3 className="font-semibold text-sm mb-2">{insight.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

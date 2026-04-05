import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Clock, Award, Target } from "lucide-react"

const stats = [
  {
    label: "En cours",
    value: "5",
    sublabel: "formations actives",
    icon: BookOpen,
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
  },
  {
    label: "Heures totales",
    value: "127h",
    sublabel: "ce mois",
    icon: Clock,
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
  {
    label: "Complétées",
    value: "18",
    sublabel: "formations terminées",
    icon: Award,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
  },
  {
    label: "Taux de réussite",
    value: "94%",
    sublabel: "excellent",
    icon: Target,
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
  },
]

export function LearningStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-6">
              <div className={`p-2 rounded-lg ${stat.bgColor} w-fit mb-3`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold mb-0.5">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.sublabel}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

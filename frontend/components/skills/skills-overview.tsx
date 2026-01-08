import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Award, Target, Zap } from "lucide-react"

const stats = [
  {
    label: "Total",
    value: "32",
    sublabel: "compétences",
    icon: Award,
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
  },
  {
    label: "Techniques",
    value: "18",
    sublabel: "hard skills",
    icon: Zap,
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
  {
    label: "Transversales",
    value: "14",
    sublabel: "soft skills",
    icon: Target,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
  },
  {
    label: "En progression",
    value: "7",
    sublabel: "ce mois",
    icon: TrendingUp,
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
  },
]

export function SkillsOverview() {
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

import { Card, CardContent } from "@/components/ui/card"
import { FolderGit2, Award, Trophy, Star } from "lucide-react"

const stats = [
  {
    label: "Projets",
    value: "12",
    sublabel: "réalisés",
    icon: FolderGit2,
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
  },
  {
    label: "Certifications",
    value: "8",
    sublabel: "obtenues",
    icon: Award,
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
  {
    label: "Réalisations",
    value: "24",
    sublabel: "badges",
    icon: Trophy,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
  },
  {
    label: "Note globale",
    value: "4.8/5",
    sublabel: "excellente",
    icon: Star,
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
  },
]

export function PortfolioStats() {
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

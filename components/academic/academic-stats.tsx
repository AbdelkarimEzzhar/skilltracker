import { Card, CardContent } from "@/components/ui/card"
import { GraduationCap, BookOpen, Trophy, TrendingUp } from "lucide-react"

const stats = [
  {
    label: "Moyenne générale",
    value: "15.7/20",
    sublabel: "Excellent",
    icon: GraduationCap,
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
  },
  {
    label: "Crédits ECTS",
    value: "180/240",
    sublabel: "75% complété",
    icon: BookOpen,
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
  {
    label: "Certifications",
    value: "8",
    sublabel: "obtenues",
    icon: Trophy,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
  },
  {
    label: "Progression",
    value: "+5%",
    sublabel: "ce semestre",
    icon: TrendingUp,
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
  },
]

export function AcademicStats() {
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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Briefcase, GraduationCap } from "lucide-react"

const goals = [
  {
    icon: Briefcase,
    title: "Poste visé",
    value: "Développeur Full-Stack",
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
  },
  {
    icon: Target,
    title: "Secteur ciblé",
    value: "Tech / Startups",
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
  {
    icon: GraduationCap,
    title: "Niveau visé",
    value: "Master 2 - 2025",
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
  },
]

export function CareerGoals() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Objectifs de carrière</CardTitle>
        <CardDescription>Votre vision professionnelle</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {goals.map((goal) => {
          const Icon = goal.icon
          return (
            <div key={goal.title} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className={`p-2 rounded-lg ${goal.bgColor}`}>
                <Icon className={`w-4 h-4 ${goal.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">{goal.title}</p>
                <p className="font-medium text-sm">{goal.value}</p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

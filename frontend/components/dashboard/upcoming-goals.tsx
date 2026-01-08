import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Calendar } from "lucide-react"

const goals = [
  { title: "Compléter 3 formations", progress: 66, deadline: "15 jours", current: 2, total: 3 },
  { title: "Maîtriser React", progress: 85, deadline: "30 jours", current: 17, total: 20 },
  { title: "Obtenir une certification", progress: 40, deadline: "45 jours", current: 2, total: 5 },
]

export function UpcomingGoals() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Objectifs en cours</CardTitle>
        <CardDescription>Vos prochaines étapes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => (
          <div key={goal.title} className="space-y-2">
            <div className="flex items-start justify-between">
              <p className="font-medium text-sm">{goal.title}</p>
              <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0 ml-2">
                <Calendar className="w-3 h-3" />
                {goal.deadline}
              </span>
            </div>
            <Progress value={goal.progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {goal.current}/{goal.total} complété
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

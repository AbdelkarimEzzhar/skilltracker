import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, BookOpen, Trophy, Target } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "achievement",
    title: "Certification React complétée",
    description: "Vous avez terminé la certification React Avancé",
    time: "Il y a 2 heures",
    icon: Trophy,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
  },
  {
    id: 2,
    type: "skill",
    title: "Nouvelle compétence acquise",
    description: "TypeScript - Niveau Intermédiaire",
    time: "Il y a 5 heures",
    icon: CheckCircle2,
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
  {
    id: 3,
    type: "course",
    title: "Formation démarrée",
    description: "Introduction au Machine Learning",
    time: "Hier",
    icon: BookOpen,
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
  },
  {
    id: 4,
    type: "goal",
    title: "Objectif atteint",
    description: "Terminer 5 formations ce mois-ci",
    time: "Il y a 2 jours",
    icon: Target,
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
  },
]

export function RecentActivities() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Activités récentes</CardTitle>
        <CardDescription>Vos dernières réalisations et progrès</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon
            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className={`p-2 rounded-lg ${activity.bgColor} shrink-0`}>
                  <Icon className={`w-4 h-4 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm mb-0.5">{activity.title}</p>
                  <p className="text-sm text-muted-foreground mb-1">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

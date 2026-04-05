import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Award, Star, Zap } from "lucide-react"

const achievements = [
  {
    id: 1,
    title: "Early Bird",
    description: "Première connexion à 6h du matin",
    icon: Zap,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
    unlocked: true,
  },
  {
    id: 2,
    title: "Streak Master",
    description: "30 jours consécutifs d'apprentissage",
    icon: Trophy,
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
    unlocked: true,
  },
  {
    id: 3,
    title: "Quick Learner",
    description: "10 formations complétées en un mois",
    icon: Star,
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
    unlocked: true,
  },
  {
    id: 4,
    title: "Skill Collector",
    description: "50 compétences acquises",
    icon: Award,
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
    unlocked: false,
  },
]

export function Achievements() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-chart-3" />
          Réalisations
        </CardTitle>
        <CardDescription>Vos badges et accomplissements</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {achievements.map((achievement) => {
          const Icon = achievement.icon
          return (
            <div
              key={achievement.id}
              className={`flex items-center gap-3 p-3 rounded-lg ${achievement.unlocked ? "bg-muted/30" : "opacity-50"}`}
            >
              <div className={`p-2 rounded-lg ${achievement.bgColor}`}>
                <Icon className={`w-4 h-4 ${achievement.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{achievement.title}</p>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

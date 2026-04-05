import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"

const challenges = [
  {
    id: 1,
    title: "Compléter 1 formation",
    reward: "50 XP",
    progress: 100,
    completed: true,
  },
  {
    id: 2,
    title: "Ajouter 3 nouvelles compétences",
    reward: "75 XP",
    progress: 66,
    completed: false,
  },
  {
    id: 3,
    title: "Se connecter avant 8h",
    reward: "25 XP",
    progress: 100,
    completed: true,
  },
]

export function DailyChallenges() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Défis quotidiens</CardTitle>
          <Badge variant="outline" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            23h restantes
          </Badge>
        </div>
        <CardDescription>Complétez vos défis pour gagner des XP</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {challenges.map((challenge) => (
          <div key={challenge.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {challenge.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
                <span className="text-sm font-medium">{challenge.title}</span>
              </div>
              <Badge
                variant="secondary"
                className={`text-xs ${challenge.completed ? "bg-success/10 text-success" : ""}`}
              >
                {challenge.reward}
              </Badge>
            </div>
            {!challenge.completed && <Progress value={challenge.progress} className="h-2" />}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy } from "lucide-react"

export function LevelProgress() {
  const currentLevel = 12
  const currentXP = 2450
  const nextLevelXP = 3000
  const progress = (currentXP / nextLevelXP) * 100

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-chart-1/10">
              <Trophy className="w-5 h-5 text-chart-1" />
            </div>
            <div>
              <p className="font-bold">Niveau {currentLevel}</p>
              <p className="text-xs text-muted-foreground">Apprenant Expert</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{currentXP} XP</p>
            <p className="text-xs text-muted-foreground">
              {nextLevelXP - currentXP} pour niveau {currentLevel + 1}
            </p>
          </div>
        </div>
        <Progress value={progress} className="h-3" />
      </CardContent>
    </Card>
  )
}

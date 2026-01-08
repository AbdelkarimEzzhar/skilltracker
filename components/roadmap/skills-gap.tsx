import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertCircle } from "lucide-react"

const gaps = [
  { skill: "Node.js", current: 45, required: 80, priority: "high" },
  { skill: "DevOps (Docker, CI/CD)", current: 30, required: 70, priority: "high" },
  { skill: "MongoDB", current: 40, required: 75, priority: "medium" },
  { skill: "AWS/Cloud", current: 25, required: 65, priority: "medium" },
]

export function SkillsGap() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Écarts de compétences</CardTitle>
        <CardDescription>Compétences à développer pour votre objectif</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {gaps.map((gap) => (
          <div key={gap.skill} className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {gap.priority === "high" && <AlertCircle className="w-3 h-3 text-warning shrink-0" />}
                <span className="text-sm font-medium">{gap.skill}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {gap.current}% / {gap.required}%
              </span>
            </div>
            <div className="relative">
              <Progress value={gap.required} className="h-2 bg-muted" />
              <Progress value={gap.current} className="h-2 absolute top-0 left-0 w-full" />
            </div>
            <p className="text-xs text-muted-foreground">Gap: {gap.required - gap.current}% à combler</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

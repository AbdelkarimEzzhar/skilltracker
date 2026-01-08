import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Flame } from "lucide-react"

const skills = [
  { name: "Docker", growth: "+45%", demand: "Très forte", hot: true },
  { name: "Kubernetes", growth: "+38%", demand: "Forte", hot: true },
  { name: "TypeScript", growth: "+42%", demand: "Très forte", hot: true },
  { name: "AWS", growth: "+35%", demand: "Forte", hot: false },
  { name: "GraphQL", growth: "+28%", demand: "Moyenne", hot: false },
]

export function TrendingSkills() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className="w-5 h-5 text-chart-3" />
          Compétences tendances
        </CardTitle>
        <CardDescription>Les plus demandées sur le marché</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {skills.map((skill) => (
          <div
            key={skill.name}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              {skill.hot && <Flame className="w-4 h-4 text-chart-3" />}
              <div>
                <p className="font-medium text-sm">{skill.name}</p>
                <p className="text-xs text-muted-foreground">Demande {skill.demand}</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs bg-success/10 text-success">
              <TrendingUp className="w-3 h-3 mr-1" />
              {skill.growth}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

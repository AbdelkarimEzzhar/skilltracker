import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, TrendingUp, Minus, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface SkillCardProps {
  skill: {
    id: number
    name: string
    level: number
    category: string
    verified: boolean
    trending: "up" | "stable" | "down"
  }
}

export function SkillCard({ skill }: SkillCardProps) {
  const getLevelLabel = (level: number) => {
    if (level >= 80) return "Expert"
    if (level >= 60) return "Avancé"
    if (level >= 40) return "Intermédiaire"
    return "Débutant"
  }

  return (
    <Card className="border-border/50 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{skill.name}</h3>
              {skill.verified && <CheckCircle2 className="w-4 h-4 text-success" title="Compétence vérifiée" />}
            </div>
            <Badge variant="secondary" className="text-xs">
              {skill.category}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Modifier</DropdownMenuItem>
              <DropdownMenuItem>Voir détails</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Supprimer</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{getLevelLabel(skill.level)}</span>
            <div className="flex items-center gap-1">
              <span className="font-medium">{skill.level}%</span>
              {skill.trending === "up" && <TrendingUp className="w-3 h-3 text-success" />}
              {skill.trending === "stable" && <Minus className="w-3 h-3 text-muted-foreground" />}
            </div>
          </div>
          <Progress value={skill.level} className="h-2" />
        </div>
      </CardContent>
    </Card>
  )
}

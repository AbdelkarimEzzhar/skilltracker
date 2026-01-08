import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Award, Star, Zap, Target, Flame } from "lucide-react"

const achievements = [
  {
    id: 1,
    title: "Premier pas",
    description: "Compléter l'onboarding",
    icon: Star,
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
    unlocked: true,
    rarity: "Commun",
  },
  {
    id: 2,
    title: "Streak Master",
    description: "30 jours consécutifs",
    icon: Flame,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
    unlocked: true,
    rarity: "Rare",
  },
  {
    id: 3,
    title: "Expert certifié",
    description: "Obtenir 5 certifications",
    icon: Award,
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
    unlocked: true,
    rarity: "Épique",
  },
  {
    id: 4,
    title: "Quick Learner",
    description: "10 formations en 1 mois",
    icon: Zap,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
    unlocked: true,
    rarity: "Rare",
  },
  {
    id: 5,
    title: "Perfectionniste",
    description: "Terminer 5 cours à 100%",
    icon: Target,
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
    unlocked: false,
    rarity: "Épique",
  },
  {
    id: 6,
    title: "Légende",
    description: "Atteindre le niveau 20",
    icon: Trophy,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
    unlocked: false,
    rarity: "Légendaire",
  },
]

const rarityColors = {
  Commun: "bg-muted text-muted-foreground",
  Rare: "bg-chart-1/10 text-chart-1",
  Épique: "bg-chart-4/10 text-chart-4",
  Légendaire: "bg-chart-3/10 text-chart-3",
}

export function AchievementsShowcase() {
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-chart-3" />
              Réalisations
            </CardTitle>
            <CardDescription>
              {unlockedCount}/{achievements.length} débloquées
            </CardDescription>
          </div>
          <Badge className="bg-primary">{Math.round((unlockedCount / achievements.length) * 100)}%</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {achievements.map((achievement) => {
            const Icon = achievement.icon
            return (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border transition-all ${
                  achievement.unlocked
                    ? "border-border/50 hover:shadow-md cursor-pointer"
                    : "border-border/30 opacity-40"
                }`}
              >
                <div className={`p-2 rounded-lg ${achievement.bgColor} w-fit mb-2`}>
                  <Icon className={`w-5 h-5 ${achievement.color}`} />
                </div>
                <h4 className="font-semibold text-sm mb-1">{achievement.title}</h4>
                <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>
                <Badge variant="secondary" className={`text-xs ${rarityColors[achievement.rarity]}`}>
                  {achievement.rarity}
                </Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

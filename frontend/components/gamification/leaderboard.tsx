import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, TrendingUp } from "lucide-react"

const leaderboard = [
  {
    rank: 1,
    name: "Marie Laurent",
    avatar: "/placeholder.svg",
    xp: 4520,
    level: 15,
    trend: "up",
  },
  {
    rank: 2,
    name: "Thomas Martin",
    avatar: "/placeholder.svg",
    xp: 4280,
    level: 14,
    trend: "stable",
  },
  {
    rank: 3,
    name: "Jean Dupont",
    avatar: "/placeholder.svg",
    xp: 2450,
    level: 12,
    trend: "up",
    isCurrentUser: true,
  },
  {
    rank: 4,
    name: "Sophie Bernard",
    avatar: "/placeholder.svg",
    xp: 2180,
    level: 11,
    trend: "down",
  },
  {
    rank: 5,
    name: "Lucas Petit",
    avatar: "/placeholder.svg",
    xp: 1950,
    level: 10,
    trend: "up",
  },
]

export function Leaderboard() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-chart-3" />
          Classement
        </CardTitle>
        <CardDescription>Top 5 de votre promotion</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {leaderboard.map((user) => (
          <div
            key={user.rank}
            className={`flex items-center gap-3 p-3 rounded-lg ${user.isCurrentUser ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/30"} transition-colors`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span
                className={`font-bold text-lg ${user.rank <= 3 ? "text-chart-3" : "text-muted-foreground"} shrink-0 w-6 text-center`}
              >
                {user.rank === 1 ? "🥇" : user.rank === 2 ? "🥈" : user.rank === 3 ? "🥉" : user.rank}
              </span>
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Niveau {user.level}</span>
                  <span>•</span>
                  <span>{user.xp} XP</span>
                </div>
              </div>
            </div>
            {user.trend === "up" && <TrendingUp className="w-4 h-4 text-success shrink-0" title="En progression" />}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

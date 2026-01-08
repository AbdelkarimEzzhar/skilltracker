import { Card, CardContent } from "@/components/ui/card"
import { Flame } from "lucide-react"

export function StreakWidget() {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-chart-3/10 to-chart-3/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-chart-3/20">
            <Flame className="w-6 h-6 text-chart-3" />
          </div>
          <div>
            <p className="text-3xl font-bold">30</p>
            <p className="text-sm text-muted-foreground">jours de série</p>
          </div>
        </div>
        <div className="mt-4 flex gap-1">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full ${i < 7 ? "bg-chart-3" : "bg-muted"}`}
              title={`Jour ${i + 1}`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Cette semaine: 7/7 jours</p>
      </CardContent>
    </Card>
  )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, ExternalLink } from "lucide-react"

const recommendations = [
  {
    id: 1,
    title: "Node.js - The Complete Guide",
    type: "Course",
    provider: "Udemy",
    duration: "40h",
    match: 95,
  },
  {
    id: 2,
    title: "Docker & Kubernetes Masterclass",
    type: "Course",
    provider: "Coursera",
    duration: "30h",
    match: 92,
  },
  {
    id: 3,
    title: "MongoDB for Developers",
    type: "Course",
    provider: "MongoDB University",
    duration: "20h",
    match: 88,
  },
]

export function RecommendedPath() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Parcours recommandé par l'IA</CardTitle>
        <CardDescription>Formations suggérées pour atteindre vos objectifs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
          >
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm mb-1">{rec.title}</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{rec.provider}</span>
                <span>•</span>
                <span>{rec.duration}</span>
                <span>•</span>
                <span className="text-success font-medium">{rec.match}% match</span>
              </div>
            </div>
            <Button size="sm" variant="outline" className="shrink-0 bg-transparent">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

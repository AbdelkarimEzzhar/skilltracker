import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Clock } from "lucide-react"

const milestones = [
  {
    id: 1,
    phase: "Court terme",
    period: "0-3 mois",
    title: "Maîtriser React et TypeScript",
    status: "in-progress",
    progress: 75,
    tasks: [
      { name: "Formation React avancé", done: true },
      { name: "Certification TypeScript", done: true },
      { name: "Projet portfolio", done: false },
    ],
  },
  {
    id: 2,
    phase: "Moyen terme",
    period: "3-6 mois",
    title: "Obtenir un stage en développement",
    status: "upcoming",
    progress: 0,
    tasks: [
      { name: "Préparer CV technique", done: false },
      { name: "Postuler à 20 entreprises", done: false },
      { name: "Préparer entretiens techniques", done: false },
    ],
  },
  {
    id: 3,
    phase: "Long terme",
    period: "6-12 mois",
    title: "Devenir développeur Full-Stack",
    status: "future",
    progress: 0,
    tasks: [
      { name: "Maîtriser Node.js et bases de données", done: false },
      { name: "Apprendre DevOps basics", done: false },
      { name: "Construire 3 projets complets", done: false },
    ],
  },
]

export function RoadmapTimeline() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Feuille de route</CardTitle>
        <CardDescription>Vos jalons vers la réussite professionnelle</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          {milestones.map((milestone) => (
            <div key={milestone.id} className="relative flex gap-4">
              <div className="relative z-10 mt-1">
                {milestone.status === "in-progress" ? (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-pulse">
                    <Clock className="w-4 h-4 text-primary-foreground" />
                  </div>
                ) : milestone.status === "upcoming" ? (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                    <Circle className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              <Card
                className={`flex-1 border ${milestone.status === "in-progress" ? "border-primary shadow-md" : "border-border/50"}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {milestone.phase}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{milestone.period}</span>
                      </div>
                      <h3 className="font-semibold mb-2">{milestone.title}</h3>
                    </div>
                    {milestone.status === "in-progress" && (
                      <span className="text-sm font-medium text-primary">{milestone.progress}%</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {milestone.tasks.map((task, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {task.done ? (
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <span className={task.done ? "text-muted-foreground line-through" : ""}>{task.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

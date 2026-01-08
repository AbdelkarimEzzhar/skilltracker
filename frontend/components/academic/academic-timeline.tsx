import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle } from "lucide-react"

const timeline = [
  {
    id: 1,
    year: "2024-2025",
    title: "Master 2 - Informatique",
    institution: "Université Paris-Saclay",
    status: "current",
    grade: "En cours",
    courses: 8,
  },
  {
    id: 2,
    year: "2023-2024",
    title: "Master 1 - Informatique",
    institution: "Université Paris-Saclay",
    status: "completed",
    grade: "16.2/20",
    courses: 12,
  },
  {
    id: 3,
    year: "2022-2023",
    title: "Licence 3 - Informatique",
    institution: "Université Paris-Saclay",
    status: "completed",
    grade: "15.8/20",
    courses: 10,
  },
  {
    id: 4,
    year: "2021-2022",
    title: "Licence 2 - Informatique",
    institution: "Université Paris-Saclay",
    status: "completed",
    grade: "14.9/20",
    courses: 10,
  },
]

export function AcademicTimeline() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Historique académique</CardTitle>
        <CardDescription>Votre parcours de formation depuis le début</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          {timeline.map((item) => (
            <div key={item.id} className="relative flex gap-4">
              <div className="relative z-10 mt-1">
                {item.status === "current" ? (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Circle className="w-4 h-4 text-primary-foreground fill-primary-foreground" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                )}
              </div>

              <Card
                className={`flex-1 border ${item.status === "current" ? "border-primary shadow-md" : "border-border/50"}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.institution}</p>
                    </div>
                    {item.status === "current" ? (
                      <Badge className="bg-primary">En cours</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                        Complété
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="text-muted-foreground">{item.year}</span>
                    <span className="text-muted-foreground">{item.courses} cours</span>
                    <span className="font-medium">{item.grade}</span>
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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

const courses = [
  {
    id: 1,
    name: "Intelligence Artificielle",
    code: "INF502",
    progress: 75,
    grade: "15.5/20",
    credits: 6,
  },
  {
    id: 2,
    name: "Systèmes distribués",
    code: "INF503",
    progress: 60,
    grade: "14.8/20",
    credits: 6,
  },
  {
    id: 3,
    name: "Sécurité informatique",
    code: "INF504",
    progress: 85,
    grade: "16.2/20",
    credits: 4,
  },
  {
    id: 4,
    name: "Gestion de projet",
    code: "MGT501",
    progress: 50,
    grade: "En cours",
    credits: 4,
  },
]

export function CurrentCourses() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Cours en cours</CardTitle>
        <CardDescription>Semestre en cours 2024-2025</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {courses.map((course) => (
          <div key={course.id} className="space-y-2 p-3 rounded-lg hover:bg-muted/30 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm mb-1">{course.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{course.code}</span>
                  <Badge variant="secondary" className="text-xs">
                    {course.credits} ECTS
                  </Badge>
                </div>
              </div>
            </div>
            <Progress value={course.progress} className="h-2" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{course.progress}% complété</span>
              <span className="font-medium">{course.grade}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

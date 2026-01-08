import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, Clock } from "lucide-react"

const courses = [
  {
    id: 1,
    title: "Docker & Kubernetes Masterclass",
    provider: "Udemy",
    progress: 45,
    currentLesson: "Section 8: Kubernetes Deployments",
    totalLessons: 156,
    completedLessons: 70,
    timeLeft: "12h restantes",
    image: "/docker-concept.png",
  },
  {
    id: 2,
    title: "Node.js Complete Guide",
    provider: "Coursera",
    progress: 68,
    currentLesson: "Module 12: Authentication & Security",
    totalLessons: 98,
    completedLessons: 67,
    timeLeft: "8h restantes",
    image: "/nodejs-logo.png",
  },
  {
    id: 3,
    title: "MongoDB for Developers",
    provider: "MongoDB University",
    progress: 28,
    currentLesson: "Chapter 4: Aggregation Pipeline",
    totalLessons: 72,
    completedLessons: 20,
    timeLeft: "18h restantes",
    image: "/mongodb-logo.png",
  },
]

export function ActiveCourses() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Formations en cours</CardTitle>
        <CardDescription>Continuez là où vous vous êtes arrêté</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {courses.map((course) => (
          <Card key={course.id} className="border-border/50 overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <div className="sm:w-32 h-24 bg-muted flex items-center justify-center">
                <img
                  src={course.image || "/placeholder.svg"}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{course.title}</h3>
                    <p className="text-sm text-muted-foreground">{course.provider}</p>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {course.progress}%
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-3">{course.currentLesson}</p>

                <div className="space-y-2 mb-3">
                  <Progress value={course.progress} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {course.completedLessons}/{course.totalLessons} leçons
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {course.timeLeft}
                    </span>
                  </div>
                </div>

                <Button size="sm" className="w-full sm:w-auto">
                  <Play className="w-4 h-4 mr-2" />
                  Continuer
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </CardContent>
    </Card>
  )
}

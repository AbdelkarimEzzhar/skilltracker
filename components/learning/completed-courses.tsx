import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Award, Download, Star } from "lucide-react"

const completed = [
  {
    id: 1,
    title: "React - The Complete Guide",
    provider: "Udemy",
    completedDate: "15 Déc 2024",
    grade: "98%",
    certificate: true,
    rating: 5,
  },
  {
    id: 2,
    title: "TypeScript Fundamentals",
    provider: "Pluralsight",
    completedDate: "28 Nov 2024",
    grade: "95%",
    certificate: true,
    rating: 5,
  },
  {
    id: 3,
    title: "Git & GitHub Essentials",
    provider: "LinkedIn Learning",
    completedDate: "10 Nov 2024",
    grade: "92%",
    certificate: false,
    rating: 4,
  },
]

export function CompletedCourses() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Formations complétées</CardTitle>
        <CardDescription>Vos réussites et certifications obtenues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {completed.map((course) => (
          <Card key={course.id} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">{course.title}</h3>
                  <p className="text-xs text-muted-foreground">{course.provider}</p>
                </div>
                {course.certificate && <Award className="w-5 h-5 text-chart-3 shrink-0 ml-2" />}
              </div>

              <div className="flex items-center gap-2 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${i < course.rating ? "text-warning fill-warning" : "text-muted-foreground"}`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span>{course.completedDate}</span>
                <Badge variant="secondary" className="text-xs bg-success/10 text-success">
                  {course.grade}
                </Badge>
              </div>

              {course.certificate && (
                <Button size="sm" variant="outline" className="w-full bg-transparent">
                  <Download className="w-3 h-3 mr-2" />
                  Télécharger le certificat
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  )
}

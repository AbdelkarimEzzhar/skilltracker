import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Clock, Star, Users } from "lucide-react"

const courses = [
  {
    id: 1,
    title: "Docker & Kubernetes pour Développeurs",
    provider: "Udemy",
    rating: 4.8,
    students: "125K",
    duration: "35h",
    level: "Intermédiaire",
    match: 98,
    tags: ["DevOps", "Docker", "Kubernetes"],
    image: "/docker-concept.png",
  },
  {
    id: 2,
    title: "Node.js: Guide Complet du Débutant à l'Expert",
    provider: "Coursera",
    rating: 4.9,
    students: "89K",
    duration: "40h",
    level: "Tous niveaux",
    match: 95,
    tags: ["Backend", "Node.js", "Express"],
    image: "/nodejs-logo.png",
  },
  {
    id: 3,
    title: "MongoDB - Base de données NoSQL Moderne",
    provider: "MongoDB University",
    rating: 4.7,
    students: "67K",
    duration: "25h",
    level: "Débutant",
    match: 92,
    tags: ["Database", "MongoDB", "NoSQL"],
    image: "/mongodb-logo.png",
  },
  {
    id: 4,
    title: "AWS Cloud Practitioner Essentials",
    provider: "AWS Training",
    rating: 4.6,
    students: "150K",
    duration: "30h",
    level: "Débutant",
    match: 88,
    tags: ["Cloud", "AWS", "Infrastructure"],
    image: "/aws-cloud-landscape.png",
  },
]

export function PersonalizedCourses() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Formations recommandées pour vous</CardTitle>
        <CardDescription>Basé sur votre profil, vos compétences et vos objectifs de carrière</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {courses.map((course) => (
          <Card key={course.id} className="border-border/50 hover:shadow-md transition-shadow overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <div className="sm:w-48 h-32 sm:h-auto bg-muted flex items-center justify-center relative overflow-hidden">
                <img
                  src={course.image || "/placeholder.svg"}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-2 right-2 bg-success">
                  <Star className="w-3 h-3 mr-1 fill-success-foreground" />
                  {course.match}% match
                </Badge>
              </div>
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{course.provider}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {course.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <span>{course.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{course.students}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {course.level}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 sm:flex-initial">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Commencer
                  </Button>
                  <Button size="sm" variant="outline" className="bg-transparent">
                    Détails
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </CardContent>
    </Card>
  )
}

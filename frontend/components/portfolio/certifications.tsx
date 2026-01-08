import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Award, ExternalLink } from "lucide-react"

const certifications = [
  {
    id: 1,
    title: "React - The Complete Guide",
    provider: "Udemy",
    date: "Déc 2024",
    verified: true,
  },
  {
    id: 2,
    title: "TypeScript Fundamentals",
    provider: "Pluralsight",
    date: "Nov 2024",
    verified: true,
  },
  {
    id: 3,
    title: "Node.js Developer",
    provider: "Coursera",
    date: "Oct 2024",
    verified: true,
  },
]

export function Certifications() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="w-5 h-5 text-chart-2" />
          Certifications
        </CardTitle>
        <CardDescription>Vos certifications vérifiées</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {certifications.map((cert) => (
          <Card key={cert.id} className="border-border/50">
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm mb-1">{cert.title}</h4>
                  <p className="text-xs text-muted-foreground">{cert.provider}</p>
                </div>
                {cert.verified && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-success/10 text-success border-success/30 shrink-0 ml-2"
                  >
                    Vérifié
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">{cert.date}</span>
                <Button size="sm" variant="ghost" className="h-7 px-2">
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Briefcase, ArrowRight } from "lucide-react"

const suggestions = [
  {
    title: "Développeur Full-Stack",
    match: 92,
    salary: "45-65K €",
    openings: "1.2K offres",
  },
  {
    title: "Ingénieur DevOps",
    match: 78,
    salary: "50-70K €",
    openings: "890 offres",
  },
  {
    title: "Développeur React",
    match: 95,
    salary: "42-60K €",
    openings: "2.1K offres",
  },
]

export function CareerSuggestions() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-chart-4" />
          Postes recommandés
        </CardTitle>
        <CardDescription>Basé sur votre profil actuel</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion) => (
          <Card key={suggestion.title} className="border-border/50 hover:border-primary transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-sm">{suggestion.title}</h4>
                <span className="text-xs font-medium text-success">{suggestion.match}%</span>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground mb-3">
                <p>{suggestion.salary}</p>
                <p>{suggestion.openings}</p>
              </div>
              <Button size="sm" variant="outline" className="w-full bg-transparent">
                Voir les offres
                <ArrowRight className="w-3 h-3 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Target, BookOpen, Award } from "lucide-react"

const actions = [
  { title: "Ajouter une compétence", href: "/skills/add", icon: Award },
  { title: "Définir un objectif", href: "/goals/new", icon: Target },
  { title: "Explorer les formations", href: "/recommendations", icon: BookOpen },
]

export function QuickActions() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Actions rapides</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Button
              key={action.title}
              variant="outline"
              className="w-full justify-start h-auto py-3 bg-transparent"
              asChild
            >
              <Link href={action.href}>
                <Icon className="w-4 h-4 mr-2" />
                {action.title}
              </Link>
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}

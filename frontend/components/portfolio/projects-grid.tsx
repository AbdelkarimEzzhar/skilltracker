import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Github, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const projects = [
  {
    id: 1,
    title: "E-commerce Platform",
    description: "Application e-commerce complète avec panier, paiement et gestion de stock",
    image: "/ecommerce-dashboard.png",
    tags: ["React", "Node.js", "MongoDB"],
    status: "Complété",
    date: "Déc 2024",
    links: {
      live: "https://example.com",
      github: "https://github.com/user/project",
    },
  },
  {
    id: 2,
    title: "Task Management App",
    description: "Application de gestion de tâches collaborative avec notifications en temps réel",
    image: "/task-manager-interface.png",
    tags: ["React", "TypeScript", "Firebase"],
    status: "Complété",
    date: "Nov 2024",
    links: {
      live: "https://example.com",
      github: "https://github.com/user/project",
    },
  },
  {
    id: 3,
    title: "Weather Dashboard",
    description: "Dashboard météo avec prévisions et visualisations interactives",
    image: "/weather-dashboard.png",
    tags: ["React", "API", "Charts"],
    status: "En cours",
    date: "En cours",
    links: {
      github: "https://github.com/user/project",
    },
  },
  {
    id: 4,
    title: "Portfolio Website",
    description: "Site portfolio personnel avec animations et design moderne",
    image: "/portfolio-website.png",
    tags: ["Next.js", "Tailwind", "Framer"],
    status: "Complété",
    date: "Oct 2024",
    links: {
      live: "https://example.com",
      github: "https://github.com/user/project",
    },
  },
]

export function ProjectsGrid() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Mes projets</CardTitle>
        <CardDescription>Portfolio de mes réalisations techniques</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="border-border/50 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-muted relative overflow-hidden">
                <img
                  src={project.image || "/placeholder.svg"}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
                {project.status === "En cours" && <Badge className="absolute top-2 right-2 bg-primary">En cours</Badge>}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{project.title}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Modifier</DropdownMenuItem>
                      <DropdownMenuItem>Dupliquer</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{project.description}</p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-xs text-muted-foreground">{project.date}</span>
                  <div className="flex gap-2">
                    {project.links.live && (
                      <Button size="sm" variant="outline" className="h-8 bg-transparent">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}
                    {project.links.github && (
                      <Button size="sm" variant="outline" className="h-8 bg-transparent">
                        <Github className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

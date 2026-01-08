import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Mail, Phone, Linkedin, Github, Edit } from "lucide-react"

export function ProfileInfo() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Informations</CardTitle>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center">
          <Avatar className="w-24 h-24 mb-4">
            <AvatarImage src="/placeholder.svg?height=96&width=96" />
            <AvatarFallback className="text-2xl">JD</AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold mb-1">Jean Dupont</h2>
          <p className="text-sm text-muted-foreground mb-2">Étudiant en Master 2 Informatique</p>
          <Badge className="bg-primary">Profil public</Badge>
        </div>

        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <span>Paris, France</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="truncate">jean.dupont@email.com</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
            <span>+33 6 12 34 56 78</span>
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <Linkedin className="w-4 h-4 mr-2" />
            linkedin.com/in/jeandupont
          </Button>
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <Github className="w-4 h-4 mr-2" />
            github.com/jeandupont
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

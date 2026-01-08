"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

const semesters = {
  s1: [
    { name: "Algorithmes avancés", code: "INF401", grade: "16.5/20", credits: 6, status: "excellent" },
    { name: "Bases de données", code: "INF402", grade: "15.2/20", credits: 6, status: "good" },
    { name: "Réseaux", code: "INF403", grade: "14.8/20", credits: 4, status: "good" },
    { name: "Génie logiciel", code: "INF404", grade: "17.0/20", credits: 6, status: "excellent" },
  ],
  s2: [
    { name: "Machine Learning", code: "INF405", grade: "15.8/20", credits: 6, status: "good" },
    { name: "Cloud Computing", code: "INF406", grade: "16.2/20", credits: 6, status: "excellent" },
    { name: "Développement mobile", code: "INF407", grade: "14.5/20", credits: 4, status: "good" },
    { name: "Architecture logicielle", code: "INF408", grade: "15.9/20", credits: 6, status: "good" },
  ],
}

export function Transcripts() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Relevés de notes</CardTitle>
        <CardDescription>Vos notes par semestre</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="s1" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="s1">Semestre 1</TabsTrigger>
            <TabsTrigger value="s2">Semestre 2</TabsTrigger>
          </TabsList>

          <TabsContent value="s1" className="space-y-3">
            {semesters.s1.map((course) => (
              <div
                key={course.code}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{course.name}</h4>
                    {course.status === "excellent" && (
                      <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                        Excellent
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{course.code}</span>
                    <span>•</span>
                    <span>{course.credits} ECTS</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{course.grade}</p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="s2" className="space-y-3">
            {semesters.s2.map((course) => (
              <div
                key={course.code}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{course.name}</h4>
                    {course.status === "excellent" && (
                      <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                        Excellent
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{course.code}</span>
                    <span>•</span>
                    <span>{course.credits} ECTS</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{course.grade}</p>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

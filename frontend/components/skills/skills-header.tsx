"use client"

import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AddSkillForm } from "./add-skill-form"

export function SkillsHeader() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold mb-1">Mes compétences</h1>
        <p className="text-muted-foreground">Gérez et développez votre portfolio de compétences</p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" className="bg-transparent">
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une compétence
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Ajouter une nouvelle compétence</DialogTitle>
              <DialogDescription>Enrichissez votre profil avec de nouvelles compétences</DialogDescription>
            </DialogHeader>
            <AddSkillForm />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

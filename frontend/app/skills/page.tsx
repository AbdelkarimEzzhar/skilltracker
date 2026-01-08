import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SkillsHeader } from "@/components/skills/skills-header"
import { SkillsOverview } from "@/components/skills/skills-overview"
import { SkillsGrid } from "@/components/skills/skills-grid"
import { SkillsRadar } from "@/components/skills/skills-radar"

export default function SkillsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <SkillsHeader />
        <SkillsOverview />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkillsGrid />
          </div>
          <div>
            <SkillsRadar />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

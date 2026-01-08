import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { RoadmapHeader } from "@/components/roadmap/roadmap-header"
import { RoadmapTimeline } from "@/components/roadmap/roadmap-timeline"
import { CareerGoals } from "@/components/roadmap/career-goals"
import { SkillsGap } from "@/components/roadmap/skills-gap"
import { RecommendedPath } from "@/components/roadmap/recommended-path"

export default function RoadmapPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <RoadmapHeader />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RoadmapTimeline />
            <RecommendedPath />
          </div>
          <div className="space-y-6">
            <CareerGoals />
            <SkillsGap />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

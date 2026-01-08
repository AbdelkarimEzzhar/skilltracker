import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PortfolioHeader } from "@/components/portfolio/portfolio-header"
import { PortfolioStats } from "@/components/portfolio/portfolio-stats"
import { ProjectsGrid } from "@/components/portfolio/projects-grid"
import { Certifications } from "@/components/portfolio/certifications"
import { Achievements } from "@/components/portfolio/achievements"

export default function PortfolioPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PortfolioHeader />
        <PortfolioStats />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ProjectsGrid />
          </div>
          <div className="space-y-6">
            <Certifications />
            <Achievements />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

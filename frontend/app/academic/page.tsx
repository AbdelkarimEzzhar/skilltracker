import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AcademicHeader } from "@/components/academic/academic-header"
import { AcademicTimeline } from "@/components/academic/academic-timeline"
import { CurrentCourses } from "@/components/academic/current-courses"
import { AcademicStats } from "@/components/academic/academic-stats"
import { Transcripts } from "@/components/academic/transcripts"

export default function AcademicPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AcademicHeader />
        <AcademicStats />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AcademicTimeline />
            <Transcripts />
          </div>
          <div>
            <CurrentCourses />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

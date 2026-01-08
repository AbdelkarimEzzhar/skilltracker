import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { LearningHeader } from "@/components/learning/learning-header"
import { LearningProgress } from "@/components/learning/learning-progress"
import { ActiveCourses } from "@/components/learning/active-courses"
import { CompletedCourses } from "@/components/learning/completed-courses"
import { LearningStats } from "@/components/learning/learning-stats"

export default function LearningPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <LearningHeader />
        <LearningStats />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ActiveCourses />
            <CompletedCourses />
          </div>
          <div>
            <LearningProgress />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

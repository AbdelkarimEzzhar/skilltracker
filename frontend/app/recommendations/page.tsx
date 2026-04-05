import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { RecommendationsHeader } from "@/components/recommendations/recommendations-header"
import { AIInsights } from "@/components/recommendations/ai-insights"
import { PersonalizedCourses } from "@/components/recommendations/personalized-courses"
import { TrendingSkills } from "@/components/recommendations/trending-skills"
import { CareerSuggestions } from "@/components/recommendations/career-suggestions"

export default function RecommendationsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <RecommendationsHeader />
        <AIInsights />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PersonalizedCourses />
          </div>
          <div className="space-y-6">
            <TrendingSkills />
            <CareerSuggestions />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

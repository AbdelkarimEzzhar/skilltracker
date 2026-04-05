import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { ProgressOverview } from "@/components/dashboard/progress-overview"
import { RecentActivities } from "@/components/dashboard/recent-activities"
import { UpcomingGoals } from "@/components/dashboard/upcoming-goals"
import { WeeklyInsights } from "@/components/dashboard/weekly-insights"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { DailyChallenges } from "@/components/gamification/daily-challenges"
import { Leaderboard } from "@/components/gamification/leaderboard"
import { AchievementsShowcase } from "@/components/gamification/achievements-showcase"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DashboardHeader />

        <DashboardStats />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ProgressOverview />
            <AchievementsShowcase />
            <RecentActivities />
          </div>
          <div className="space-y-6">
            <QuickActions />
            <DailyChallenges />
            <UpcomingGoals />
            <Leaderboard />
            <WeeklyInsights />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

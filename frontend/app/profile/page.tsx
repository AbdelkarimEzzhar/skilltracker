import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileInfo } from "@/components/profile/profile-info"
import { ProfileAbout } from "@/components/profile/profile-about"
import { ProfileExperience } from "@/components/profile/profile-experience"
import { ProfileEducation } from "@/components/profile/profile-education"
import { ProfileSkillsPreview } from "@/components/profile/profile-skills-preview"

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <ProfileHeader />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ProfileAbout />
            <ProfileExperience />
            <ProfileEducation />
          </div>
          <div className="space-y-6">
            <ProfileInfo />
            <ProfileSkillsPreview />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

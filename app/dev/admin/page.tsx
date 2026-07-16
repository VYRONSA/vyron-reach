import { DevPageHeader } from '@/components/dev/ui'
import { AdminOverview } from '@/components/dev/admin/AdminOverview'

export default function DevAdminOverviewPage() {
  return (
    <div>
      <DevPageHeader
        eyebrow="Administration"
        title="Owner Administration Centre"
        description="Configure the VYRON Development Operating System itself — products, milestones, and batches. Owner-only, separate from day-to-day development."
      />
      <AdminOverview />
    </div>
  )
}

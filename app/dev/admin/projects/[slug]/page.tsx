import { DevPageHeader } from '@/components/dev/ui'
import { AdminProjectDetail } from '@/components/dev/admin/AdminProjectDetail'

export default async function DevAdminProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  return (
    <div>
      <DevPageHeader eyebrow="Administration" title="Edit Project" description="Update product details, milestones, and batches." />
      <AdminProjectDetail slug={slug} />
    </div>
  )
}

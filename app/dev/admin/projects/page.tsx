import Link from 'next/link'
import { DevButton, DevPageHeader } from '@/components/dev/ui'
import { AdminProjectsTable } from '@/components/dev/admin/AdminProjectsTable'

export default function DevAdminProjectsPage() {
  return (
    <div>
      <DevPageHeader
        eyebrow="Administration"
        title="Project Administration"
        description="Create, edit, archive, and restore products tracked across VYRON DEV."
        actions={
          <Link href="/dev/admin/projects/new">
            <DevButton>New Project</DevButton>
          </Link>
        }
      />
      <AdminProjectsTable />
    </div>
  )
}

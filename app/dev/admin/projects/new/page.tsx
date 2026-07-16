import { DevPageHeader } from '@/components/dev/ui'
import { AdminProjectForm } from '@/components/dev/admin/AdminProjectForm'

export default function DevAdminNewProjectPage() {
  return (
    <div>
      <DevPageHeader eyebrow="Administration" title="New Project" description="Add a new product to the VYRON portfolio." />
      <AdminProjectForm />
    </div>
  )
}

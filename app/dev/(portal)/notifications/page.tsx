import { DevPageHeader } from '@/components/dev/ui'
import { NotificationsPanel } from '@/components/dev/NotificationsPanel'

export default function DevNotificationsPage() {
  return (
    <div>
      <DevPageHeader
        eyebrow="Enterprise Notifications"
        title="Notifications"
        description="Every notification the Notification Service has raised, across every project, updated live."
      />
      <NotificationsPanel />
    </div>
  )
}

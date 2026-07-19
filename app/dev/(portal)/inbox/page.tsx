import { DevPageHeader } from '@/components/dev/ui'
import { GlobalEngineeringInboxView } from '@/components/dev/GlobalEngineeringInboxView'

export default function DevInboxPage() {
  return (
    <div>
      <DevPageHeader
        eyebrow="Engineering"
        title="Engineering Inbox"
        description="Every required CEO interruption across every autonomous run, in one place."
      />
      <GlobalEngineeringInboxView />
    </div>
  )
}

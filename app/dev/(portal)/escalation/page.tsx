import { DevPageHeader } from '@/components/dev/ui'
import { EscalationStatusPanel } from '@/components/dev/EscalationStatusPanel'

export default function DevEscalationPage() {
  return (
    <div>
      <DevPageHeader
        eyebrow="Engineering Inbox"
        title="Escalation"
        description="Which unresolved inbox items are being monitored, their current escalation level, and the full escalation history."
      />
      <EscalationStatusPanel />
    </div>
  )
}

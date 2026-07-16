import { DevPageHeader } from '@/components/dev/ui'
import { ActivityTimeline } from '@/components/dev/ActivityTimeline'

export default function DevActivityPage() {
  return (
    <div>
      <DevPageHeader
        eyebrow="Timeline"
        title="Global Activity"
        description="Every journal entry, task, milestone, batch, release, decision, risk, debt item, and prompt update, merged into one chronological feed."
      />
      <ActivityTimeline />
    </div>
  )
}

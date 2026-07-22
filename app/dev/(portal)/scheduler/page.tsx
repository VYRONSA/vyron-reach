import { DevPageHeader } from '@/components/dev/ui'
import { SchedulerStatusPanel } from '@/components/dev/SchedulerStatusPanel'

export default function DevSchedulerPage() {
  return (
    <div>
      <DevPageHeader
        eyebrow="Cross-Project Execution"
        title="Scheduler"
        description="Which projects are running, waiting, paused, or blocked, and the Scheduler's current execution order across all of them."
      />
      <SchedulerStatusPanel />
    </div>
  )
}

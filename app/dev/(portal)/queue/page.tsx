import { DevPageHeader } from '@/components/dev/ui'
import { QueueBoard } from '@/components/dev/QueueBoard'

export default function DevQueuePage() {
  return (
    <div>
      <DevPageHeader
        eyebrow="Workflow"
        title="Development Queue"
        description="A persistent task queue stored in your browser. Create, edit, complete, and delete tasks across any project."
      />
      <QueueBoard />
    </div>
  )
}

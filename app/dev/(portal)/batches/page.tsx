import { DevPageHeader } from '@/components/dev/ui'
import { BatchesBoard } from '@/components/dev/BatchesBoard'

export default function DevBatchesPage() {
  return (
    <div>
      <DevPageHeader
        eyebrow="Execution"
        title="Batch Manager"
        description="Every development batch — objective, summary, lessons learned, and the Claude prompt that shipped it."
      />
      <BatchesBoard />
    </div>
  )
}

import { DevPageHeader } from '@/components/dev/ui'
import { DecisionsBoard } from '@/components/dev/DecisionsBoard'

export default function DevDecisionsPage() {
  return (
    <div>
      <DevPageHeader
        eyebrow="Architecture"
        title="Architecture Decisions"
        description="A searchable record of decisions, why they were made, and what was considered instead."
      />
      <DecisionsBoard />
    </div>
  )
}

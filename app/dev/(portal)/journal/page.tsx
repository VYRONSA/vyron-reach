import { DevPageHeader } from '@/components/dev/ui'
import { JournalBoard } from '@/components/dev/JournalBoard'

export default function DevJournalPage() {
  return (
    <div>
      <DevPageHeader
        eyebrow="Log"
        title="Development Journal"
        description="A daily record of what shipped, what went wrong, and what's next — searchable across every entry."
      />
      <JournalBoard />
    </div>
  )
}

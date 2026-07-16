import { DevPageHeader } from '@/components/dev/ui'
import { RisksBoard } from '@/components/dev/RisksBoard'

export default function DevRisksPage() {
  return (
    <div>
      <DevPageHeader
        eyebrow="Governance"
        title="Risk Register"
        description="Every known risk across VYRON products — severity, probability, mitigation, and ownership."
      />
      <RisksBoard />
    </div>
  )
}

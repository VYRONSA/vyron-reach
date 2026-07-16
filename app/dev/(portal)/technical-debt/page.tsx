import { DevPageHeader } from '@/components/dev/ui'
import { TechnicalDebtBoard } from '@/components/dev/TechnicalDebtBoard'

export default function DevTechnicalDebtPage() {
  return (
    <div>
      <DevPageHeader
        eyebrow="Maintenance"
        title="Technical Debt Register"
        description="Outstanding shortcuts and cleanup work across VYRON products, prioritised and tracked to resolution."
      />
      <TechnicalDebtBoard />
    </div>
  )
}

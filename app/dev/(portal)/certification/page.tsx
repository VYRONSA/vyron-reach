import { DevPageHeader } from '@/components/dev/ui'
import { CertificationDashboard } from '@/components/dev/CertificationDashboard'

export default function DevCertificationPage() {
  return (
    <div>
      <DevPageHeader
        eyebrow="Production Validation"
        title="Autonomous Delivery Certification"
        description="Objective proof that VYRON DEV repeatedly delivers complete software features with minimal human intervention."
      />
      <CertificationDashboard />
    </div>
  )
}

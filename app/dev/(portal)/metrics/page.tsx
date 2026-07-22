import { DevPageHeader } from '@/components/dev/ui'
import { MetricsDashboard } from '@/components/dev/MetricsDashboard'

export default function DevMetricsPage() {
  return (
    <div>
      <DevPageHeader
        eyebrow="Production Validation"
        title="Engineering Metrics"
        description="Objective, continuously-measured evidence that VYRON DEV operates as an autonomous software engineering organization."
      />
      <MetricsDashboard />
    </div>
  )
}

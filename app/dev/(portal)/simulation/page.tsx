import { DevPageHeader } from '@/components/dev/ui'
import { SimulationDashboard } from '@/components/dev/SimulationDashboard'

export default function DevSimulationPage() {
  return (
    <div>
      <DevPageHeader
        eyebrow="Production Validation"
        title="Engineering Simulation"
        description="Deterministic, repeatable stress validation proving VYRON DEV remains autonomous and reliable under realistic engineering workloads."
      />
      <SimulationDashboard />
    </div>
  )
}

import { DevPageHeader } from '@/components/dev/ui'
import { MilestonesBoard } from '@/components/dev/MilestonesBoard'
import { ReleasesLog } from '@/components/dev/ReleasesLog'

export default function DevMilestonesPage() {
  return (
    <div>
      <DevPageHeader
        eyebrow="Planning"
        title="Milestone Manager"
        description="Every milestone across every product, with linked batches, decisions, and releases."
      />
      <MilestonesBoard />
      <div className="mt-6">
        <ReleasesLog />
      </div>
    </div>
  )
}

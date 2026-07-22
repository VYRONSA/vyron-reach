import { DevPageHeader } from '@/components/dev/ui'
import { InitiationListView } from '@/components/dev/initiation/InitiationListView'

export default function DevInitiationPage() {
  return (
    <div>
      <DevPageHeader
        eyebrow="Mandatory Entry Point"
        title="Project Initiation"
        description="Turn a single Executive Directive into an assessed, reviewed, and approved engineering programme — milestones, delivery batches, risks, and dependencies — before it hands off into autonomous execution."
      />
      <InitiationListView />
    </div>
  )
}

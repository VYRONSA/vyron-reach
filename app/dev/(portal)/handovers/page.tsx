import { DevPageHeader } from '@/components/dev/ui'
import { HandoverWorkspace } from '@/components/dev/HandoverWorkspace'

export default function DevHandoversPage() {
  return (
    <div>
      <DevPageHeader
        eyebrow="Claude Intelligence"
        title="Handover Workspace"
        description="Paste in Claude implementation reports after each batch — the record of what shipped, what broke, and what's next."
      />
      <HandoverWorkspace />
    </div>
  )
}

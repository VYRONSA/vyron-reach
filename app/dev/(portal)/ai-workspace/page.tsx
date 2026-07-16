import { DevPageHeader, DevPlaceholderNote } from '@/components/dev/ui'
import { AiWorkspaceCard } from '@/components/dev/AiWorkspaceCard'

export default function DevAiWorkspacePage() {
  return (
    <div>
      <DevPageHeader
        eyebrow="Coordination"
        title="AI Workspace"
        description="Status board for AI assistants working across VYRON projects, saved to your browser."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AiWorkspaceCard assistant="claude" name="Claude" role="Primary engineering agent" gradient="from-orange-500 to-amber-500" />
        <AiWorkspaceCard assistant="chatgpt" name="ChatGPT" role="Secondary / handoff assistant" gradient="from-emerald-500 to-teal-500" />
      </div>

      <DevPlaceholderNote>
        No AI execution is wired to this page. Fields are entered and saved manually.
      </DevPlaceholderNote>
    </div>
  )
}

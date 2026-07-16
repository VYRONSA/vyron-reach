import { DevPageHeader } from '@/components/dev/ui'
import { PromptLibraryBoard } from '@/components/dev/PromptLibraryBoard'

export default function DevPromptsPage() {
  return (
    <div>
      <DevPageHeader
        eyebrow="Reference"
        title="Prompt Library"
        description="Reusable prompts across development, SQL, marketing, architecture, and every AI assistant this team uses."
      />
      <PromptLibraryBoard />
    </div>
  )
}

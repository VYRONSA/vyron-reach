import Link from 'next/link'
import { DevPageHeader } from '@/components/dev/ui'
import { InitiationIntakeForm } from '@/components/dev/initiation/InitiationIntakeForm'

export default function DevNewInitiationPage() {
  return (
    <div>
      <Link href="/dev/initiation" className="mb-4 inline-flex items-center gap-1.5 text-xs text-[var(--dev-text-faint)] hover:text-[var(--dev-text)]">
        &larr; Project Initiation
      </Link>
      <DevPageHeader
        eyebrow="Step 1 of 4"
        title="New Executive Directive"
        description="Describe what to build. Submitting reserves the project and produces a Draft you can generate an engineering programme from on the next step."
      />
      <InitiationIntakeForm />
    </div>
  )
}

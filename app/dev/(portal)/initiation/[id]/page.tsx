import Link from 'next/link'
import { InitiationDetailView } from '@/components/dev/initiation/InitiationDetailView'

export default async function DevInitiationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div>
      <Link href="/dev/initiation" className="mb-4 inline-flex items-center gap-1.5 text-xs text-[var(--dev-text-faint)] hover:text-[var(--dev-text)]">
        &larr; Project Initiation
      </Link>
      <InitiationDetailView id={id} />
    </div>
  )
}

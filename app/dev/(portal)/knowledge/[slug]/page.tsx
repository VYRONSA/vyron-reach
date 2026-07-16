import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getKnowledgeSection, KNOWLEDGE_SECTIONS } from '@/lib/dev/knowledgeData'
import { DevPageHeader } from '@/components/dev/ui'
import { KnowledgeEditor } from '@/components/dev/KnowledgeEditor'
import { KnowledgeVisitTracker } from '@/components/dev/KnowledgeVisitTracker'

export function generateStaticParams() {
  return KNOWLEDGE_SECTIONS.map(s => ({ slug: s.slug }))
}

export default async function DevKnowledgeSectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const section = getKnowledgeSection(slug)

  if (!section) {
    notFound()
  }

  return (
    <div>
      <KnowledgeVisitTracker slug={section.slug} title={section.title} />

      <Link
        href="/dev/knowledge"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-[var(--dev-text-faint)] hover:text-[var(--dev-text)]"
      >
        &larr; Knowledge Centre
      </Link>

      <DevPageHeader eyebrow="Knowledge Centre" title={section.title} description={section.description} />

      <KnowledgeEditor slug={section.slug} />
    </div>
  )
}

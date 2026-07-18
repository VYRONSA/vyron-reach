import Link from 'next/link'
import { SEED_PROJECT_SLUGS } from '@/lib/dev/projectsData'
import { getGitIntelligence } from '@/lib/dev/gitIntelligence'
import { getBuildIntelligence } from '@/lib/dev/buildIntelligence'
import { DevPageHeader } from '@/components/dev/ui'
import { EngineeringAssessmentPanel } from '@/components/dev/EngineeringAssessmentPanel'

export function generateStaticParams() {
  return SEED_PROJECT_SLUGS.map(slug => ({ slug }))
}

export default async function DevAssessmentProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const git = getGitIntelligence()
  const build = getBuildIntelligence()

  return (
    <div>
      <Link href="/dev/assessment" className="mb-4 inline-flex items-center gap-1.5 text-xs text-[var(--dev-text-faint)] hover:text-[var(--dev-text)]">
        &larr; Assessment Centre
      </Link>
      <DevPageHeader eyebrow="Engineering Assessment" title={slug} description="Read-only observation, analysis, and recommendations." />
      <EngineeringAssessmentPanel projectSlug={slug} git={git} build={build} />
    </div>
  )
}

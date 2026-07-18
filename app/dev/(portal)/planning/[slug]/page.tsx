import Link from 'next/link'
import { SEED_PROJECT_SLUGS } from '@/lib/dev/projectsData'
import { getGitIntelligence } from '@/lib/dev/gitIntelligence'
import { getBuildIntelligence } from '@/lib/dev/buildIntelligence'
import { getDeploymentIntelligence } from '@/lib/dev/deploymentIntelligence'
import { DevPageHeader } from '@/components/dev/ui'
import { PlanningCentreProjectView } from '@/components/dev/PlanningCentreProjectView'

export function generateStaticParams() {
  return SEED_PROJECT_SLUGS.map(slug => ({ slug }))
}

export default async function DevPlanningProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const git = getGitIntelligence()
  const build = getBuildIntelligence()
  const deployment = getDeploymentIntelligence({
    buildStatus: build.lastBuildStatus,
    typescriptStatus: build.lastTypeScriptStatus,
    gitReadiness: git.workingTreeStatus,
  })

  return (
    <div>
      <Link href="/dev/planning" className="mb-4 inline-flex items-center gap-1.5 text-xs text-[var(--dev-text-faint)] hover:text-[var(--dev-text)]">
        &larr; Planning Centre
      </Link>
      <DevPageHeader eyebrow="Engineering Plan" title={slug} description="Prepares work for approval — read-only until approved." />
      <PlanningCentreProjectView
        slug={slug}
        buildStatus={build.lastBuildStatus}
        typescriptStatus={build.lastTypeScriptStatus}
        git={git}
        deployment={deployment}
        build={build}
      />
    </div>
  )
}

import { SEED_PROJECT_SLUGS } from '@/lib/dev/projectsData'
import { getGitIntelligence } from '@/lib/dev/gitIntelligence'
import { getDeploymentIntelligence } from '@/lib/dev/deploymentIntelligence'
import { getBuildIntelligence } from '@/lib/dev/buildIntelligence'
import { ProjectDetailView } from '@/components/dev/ProjectDetailView'

export function generateStaticParams() {
  return SEED_PROJECT_SLUGS.map(slug => ({ slug }))
}

export default async function DevProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const git = getGitIntelligence()
  const build = getBuildIntelligence()
  const deployment = getDeploymentIntelligence({
    buildStatus: build.lastBuildStatus,
    typescriptStatus: build.lastTypeScriptStatus,
    gitReadiness: git.workingTreeStatus,
  })

  return (
    <ProjectDetailView
      slug={slug}
      buildStatus={build.lastBuildStatus}
      typescriptStatus={build.lastTypeScriptStatus}
      git={git}
      deployment={deployment}
      build={build}
    />
  )
}

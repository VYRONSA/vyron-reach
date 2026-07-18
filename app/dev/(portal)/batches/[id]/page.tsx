import { getGitIntelligence } from '@/lib/dev/gitIntelligence'
import { getDeploymentIntelligence } from '@/lib/dev/deploymentIntelligence'
import { getBuildIntelligence } from '@/lib/dev/buildIntelligence'
import { BatchExecutionPanel } from '@/components/dev/BatchExecutionPanel'

/**
 * No generateStaticParams: batch ids are generated at runtime in
 * localStorage (lib/dev/batchesStorage.ts), so there's no fixed list to
 * enumerate at build time — this route renders dynamically per request,
 * same as any other id-keyed detail page would without one.
 */
export default async function DevBatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const git = getGitIntelligence()
  const build = getBuildIntelligence()
  const deployment = getDeploymentIntelligence({
    buildStatus: build.lastBuildStatus,
    typescriptStatus: build.lastTypeScriptStatus,
    gitReadiness: git.workingTreeStatus,
  })

  return <BatchExecutionPanel batchId={id} git={git} deployment={deployment} build={build} />
}

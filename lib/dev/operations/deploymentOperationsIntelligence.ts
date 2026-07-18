import type { GitIntelligence } from '../gitIntelligence'
import type { DeploymentIntelligence } from '../deploymentIntelligence'
import type { Handover } from '../handoverStorage'
import type { DeploymentSnapshot, RollbackPoint } from './operationsTypes'

/**
 * Client-safe composition over already-computed Git/Deployment
 * Intelligence — nothing here re-parses .git or re-reads env vars.
 * "Deployment History" has no honest source in this system (no
 * deployment-triggering capability, no deployment webhook), so it isn't
 * represented as a literal deployment log; "Release Notes" is instead
 * built from applied Handovers — each one genuinely is a completed
 * change cycle, which is the closest real proxy this system can offer.
 * Rollback points come from a real `git log` capture (server-side, passed
 * in) rather than being fabricated from the single commit Git Intelligence
 * itself exposes.
 */
export function buildDeploymentSnapshot(
  git: GitIntelligence,
  deployment: DeploymentIntelligence,
  appliedHandovers: Handover[],
  rollbackPoints: RollbackPoint[]
): DeploymentSnapshot {
  return {
    branch: git.branch,
    commitHash: git.commitHash,
    commitMessage: git.commitMessage,
    workingTreeStatus: git.workingTreeStatus,
    deploymentAvailable: deployment.deploymentAvailable,
    environment: deployment.environment,
    productionUrl: deployment.productionUrl,
    rollbackPoints,
    releaseNotes: appliedHandovers.slice(0, 5).map(h => h.executiveSummary || h.objective || 'No summary recorded.'),
  }
}

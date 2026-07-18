import type { DevelopmentJob } from '../runtime/runtimeTypes'
import type { DeploymentIntelligence } from '../deploymentIntelligence'
import type { QualityGateReport, LifecycleStage } from './operationsTypes'

/**
 * Derives which of the 13 lifecycle stages a job is currently in —
 * deterministic reads of signals that already exist (job.status,
 * job.appliedAt, Quality Gate results, deployment configuration), never a
 * new mutable state machine or a second store of job state.
 *
 * Two stages precede a job record's existence and are never returned by
 * this function: "Requested" (the moment Mission Control starts building
 * context) and "Planning" (the Development Planning Engine selecting a
 * task) — Mission Control's own transient client state already represents
 * those, before any job is created.
 *
 * "Testing" is never automatically emitted: this repository has zero test
 * files (confirmed by Quality Intelligence's own Missing Tests finding),
 * so there is nothing to honestly report as "under test." "Deployed" is
 * never automatically emitted either — this system has no deployment-
 * triggering capability and no way to correlate a specific job with a
 * specific deployment event. Both remain in the type for the stage this
 * system could reach if that capability is ever added, not because this
 * function can detect them today.
 */
export function deriveLifecycleStage(
  job: DevelopmentJob,
  gates: QualityGateReport | null,
  deployment: DeploymentIntelligence | null
): LifecycleStage {
  if (job.status === 'Queued') return 'Queued'
  if (job.status === 'Running') return 'Executing'
  if (job.status === 'Validating') return 'Validating'
  if (job.status === 'Cancelled') return 'Rolled Back'
  if (job.status === 'Failed') return 'Failed'
  if (job.status === 'Completed' && !job.appliedAt) return 'Reviewing'
  if (job.status === 'Updating') return 'Applied'

  // job.appliedAt is set from here on — the write already happened.
  if (!gates) return 'Applied'
  if (!gates.allPassed) return 'Failed'
  if (deployment?.deploymentAvailable) return 'Ready for Deployment'
  return 'Completed'
}

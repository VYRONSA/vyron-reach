import { createHash } from 'node:crypto'
import { computeKnowledgeVersion, computeDNAVersion } from '../knowledge/knowledgeVersion'
import { getMetadata } from '../planningState/planningStateService'

/**
 * Version 2.0 Milestone 2.2 — the four version values every batch
 * receives and freezes for its lifetime (see serverExecutionLoop.ts's
 * runLoopBody, which computes this exactly once per synchronization
 * boundary and never again mid-batch). `knowledgeVersion` and
 * `dnaVersion` are read straight from the one authoritative algorithm
 * (lib/dev/knowledge/knowledgeVersion.ts); `planningVersion` is the
 * Planning Service's own existing per-project counter
 * (planningStateService.getMetadata) — nothing new to compute there, just
 * a fresh read. `executionContextVersion` is a short, deterministic
 * digest of the other three: a single compact value for logs/UI/
 * comparisons that would otherwise need to compare three fields.
 */
export type EngineeringContextVersions = {
  executionContextVersion: string
  knowledgeVersion: string
  planningVersion: number
  dnaVersion: string
}

export function computeEngineeringContextVersions(project: string): EngineeringContextVersions {
  const knowledgeVersion = computeKnowledgeVersion(project)
  const dnaVersion = computeDNAVersion(project)
  const planningVersion = getMetadata(project)?.planningVersion ?? 0

  const executionContextVersion = createHash('sha1')
    .update(`${knowledgeVersion}::${planningVersion}::${dnaVersion}`)
    .digest('hex')
    .slice(0, 16)

  return { executionContextVersion, knowledgeVersion, planningVersion, dnaVersion }
}

/** `null` (no prior recorded versions — e.g. the very first batch of a run, or a forced post-recovery refresh) never counts as equal, so the caller always treats it as "changed." */
export function engineeringContextVersionsEqual(a: EngineeringContextVersions, b: EngineeringContextVersions | null): boolean {
  if (!b) return false
  return a.knowledgeVersion === b.knowledgeVersion && a.planningVersion === b.planningVersion && a.dnaVersion === b.dnaVersion
}

/** A human-readable summary of what changed, for the Knowledge Service timeline entry Live Knowledge Refresh logs on every actual (non-forced) refresh — see liveKnowledgeRefresh.ts for the separate, explicit message used when a refresh is forced by recovery. */
export function describeVersionChange(next: EngineeringContextVersions, previous: EngineeringContextVersions | null): string {
  if (!previous) return 'Initial engineering context load for this run.'
  const changes: string[] = []
  if (next.planningVersion !== previous.planningVersion) changes.push(`Planning Service (v${previous.planningVersion} → v${next.planningVersion})`)
  if (next.knowledgeVersion !== previous.knowledgeVersion) changes.push('Knowledge Service')
  if (next.dnaVersion !== previous.dnaVersion) changes.push('Engineering DNA')
  return changes.length > 0 ? `Changed: ${changes.join(', ')}.` : 'No detectable change.'
}

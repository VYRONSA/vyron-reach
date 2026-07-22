import * as planningStateService from '../planningState/planningStateService'
import { getDevelopmentRules } from '../knowledge/developmentRulesStore'
import { recordTimelineEvent } from '../knowledge/knowledgeService'
import { computeEngineeringContextVersions, engineeringContextVersionsEqual, describeVersionChange, type EngineeringContextVersions } from './engineeringContextVersion'
import type { ExecutionSnapshot } from './executionSnapshotTypes'

/**
 * Live Knowledge Refresh (Version 2.0, Milestone 2.2) — the ONLY place
 * engineering context is ever reloaded from the durable server-owned
 * sources (Planning Service, Knowledge Service, DNA Profile, Development
 * Rules). Called exclusively at synchronization boundaries — the top of
 * serverExecutionLoop.ts's runLoopBody, which is simultaneously "before a
 * new batch begins," "after a batch completes," and (since
 * resumeServerDirector/recoverActiveDirectorsOnStartup both re-enter the
 * loop at this exact same point) "after a CEO approval resumes execution"
 * and "after recovery bootstrap resumes execution." Never called from
 * anywhere mid-batch — there is no polling, subscription, or timer here,
 * only a comparison performed once each time control returns to this one
 * point.
 *
 * Comparison-based by design: if nothing has changed since `lastVersions`,
 * this is a handful of cheap counter/metadata reads and the existing
 * snapshot is returned completely untouched — no write, no timeline
 * entry. This is also what makes "multiple CEO edits during a batch
 * collapse into one refresh" true without any queue or edit log: every
 * individual edit just updates durable state (Planning/Knowledge Service
 * counters); this function only ever asks "what does that state say
 * right now," once, the next time a boundary is reached — however many
 * edits happened in between collapse into that one read.
 */
export type RefreshOutcome = {
  snapshot: ExecutionSnapshot
  versions: EngineeringContextVersions
  refreshed: boolean
}

export type RefreshOptions = {
  /**
   * Set only by the crash-recovery path (serverExecutionLoop.ts's
   * runServerLoop, exclusively the recovery/direct-entry route — never
   * startServerDirector/resumeServerDirector). Bypasses the
   * comparison-based skip entirely: "recovery must never replay stale
   * engineering context" means a refresh must happen here even in the
   * (routine) case where the persisted lastVersions happens to already
   * match current state exactly — trusting that match would mean trusting
   * whatever the pre-crash process last recorded, which is exactly what
   * must not be trusted after an unplanned restart.
   */
  force?: boolean
}

export function refreshEngineeringContextIfNeeded(
  snapshot: ExecutionSnapshot,
  lastVersions: EngineeringContextVersions | null,
  options: RefreshOptions = {}
): RefreshOutcome {
  const versions = computeEngineeringContextVersions(snapshot.project)

  if (!options.force && engineeringContextVersionsEqual(versions, lastVersions)) {
    return { snapshot, versions, refreshed: false }
  }

  const refreshedSnapshot = reloadEngineeringContext(snapshot)

  recordTimelineEvent({
    project: snapshot.project,
    category: 'Knowledge Refresh',
    title: 'Engineering context refreshed',
    detail: options.force
      ? 'Forced refresh after recovery bootstrap — no pre-restart context is trusted.'
      : describeVersionChange(versions, lastVersions),
  })

  return { snapshot: refreshedSnapshot, versions, refreshed: true }
}

/**
 * Reloads exactly the fields of the snapshot that represent "current
 * engineering context" (decisions/technicalDebt/openRisks/
 * developmentRules) from their durable server-owned sources — everything
 * else (milestones/batches/completions/productBible) is untouched, since
 * those aren't in this milestone's refresh-source list and are already
 * kept current by their own dedicated logic elsewhere in the loop.
 *
 * Uses the exact same filtering rules lib/dev/runtime/directorHandoff.ts
 * applies at the original hand-off (top 10 decisions; High-priority,
 * unresolved technical debt; High-severity, still-open risks) so a
 * mid-run refresh can never disagree with the initial hand-off about what
 * counts as "in scope" for the batch's context.
 */
function reloadEngineeringContext(snapshot: ExecutionSnapshot): ExecutionSnapshot {
  const project = snapshot.project

  const decisions = planningStateService
    .listDecisions(project)
    .slice(0, 10)
    .map(d => ({ decision: d.decision, reason: d.reason }))

  const technicalDebt = planningStateService
    .listTechnicalDebt(project)
    .filter(d => d.priority === 'High' && d.status !== 'Resolved')
    .map(d => ({ title: d.title, priority: d.priority, relatedBatch: d.relatedBatch }))

  const openRisks = planningStateService
    .listRisks(project)
    .filter(r => r.status !== 'Mitigated' && r.status !== 'Closed' && r.severity === 'High')
    .map(r => ({ title: r.title, severity: r.severity, relatedMilestone: r.relatedMilestone }))

  const developmentRules = getDevelopmentRules().content

  return { ...snapshot, decisions, technicalDebt, openRisks, developmentRules }
}

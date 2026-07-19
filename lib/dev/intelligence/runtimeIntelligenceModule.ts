import type { DevelopmentJob } from '../runtime/runtimeTypes'
import type { Handover } from '../handoverStorage'
import type { EngineeringFinding } from './types'

const STALLED_DAYS = 7

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000))
}

/**
 * Client-side. `jobs` is expected newest-first (the order runtimeStorage
 * already returns, since saveJob unshifts) — nothing here re-sorts or
 * re-derives that ordering. Every detector reads directly off already-
 * persisted job/handover records; nothing is inferred beyond counting and
 * comparing literal field values.
 */
export function scanRuntimeIntelligence(jobs: DevelopmentJob[], handovers: Handover[]): EngineeringFinding[] {
  const findings: EngineeringFinding[] = []

  findings.push(...detectRecurringFailures(jobs))
  findings.push(...detectRepeatedRecommendations(handovers))
  findings.push(...detectExecutionLoops(jobs))
  findings.push(...detectStalledDevelopment(jobs))

  return findings
}

function detectRecurringFailures(jobs: DevelopmentJob[]): EngineeringFinding[] {
  let consecutive = 0
  for (const job of jobs) {
    if (job.status === 'Failed') consecutive++
    else break
  }
  if (consecutive < 2) return []
  return [
    {
      module: 'Runtime',
      category: 'Recurring Failure',
      severity: consecutive >= 3 ? 'High' : 'Medium',
      title: `${consecutive} consecutive failed runtime executions`,
      evidence: jobs
        .slice(0, consecutive)
        .map(j => j.error ?? 'no error message')
        .join(' | '),
      location: null,
      recommendation: 'Review the last failed executions before running the runtime again — the same failure is likely to repeat.',
    },
  ]
}

function detectRepeatedRecommendations(handovers: Handover[]): EngineeringFinding[] {
  const recent = handovers.slice(0, 5).filter(h => h.nextSuggestedBatch.trim() !== '')
  const counts = new Map<string, number>()
  for (const h of recent) counts.set(h.nextSuggestedBatch, (counts.get(h.nextSuggestedBatch) ?? 0) + 1)

  const findings: EngineeringFinding[] = []
  for (const [text, count] of counts) {
    if (count >= 2) {
      findings.push({
        module: 'Runtime',
        category: 'Repeated Recommendation',
        severity: 'Medium',
        title: 'The same next-batch suggestion recurred across handovers',
        evidence: `"${text}" appears in ${count} of the last ${recent.length} handovers.`,
        location: '/dev/handovers',
        recommendation: `"${text}" has been suggested repeatedly without being acted on — prioritize it or explicitly deprioritize it.`,
      })
    }
  }
  return findings
}

/**
 * Recurrence Detection — compares Execution Identity, never generic
 * runtime/prompt text. Two jobs only count as "the same execution
 * repeating" when their executionIdentityKey matches exactly: same
 * project/milestone/batch, same batch revision, same repository commit,
 * same knowledge version (see executionIdentity.ts — that key is built
 * from exactly these fields, so "the key changed" and "something
 * meaningful changed" are the same fact). Jobs with no recorded identity
 * (created before this concept existed) each get a unique fallback key so
 * legacy history never falsely groups together.
 *
 * Two further conditions apply before a finding is raised, matching the
 * Planning Rules' Recurrence Detection allow-list:
 * - explicitRerun jobs (a CEO-initiated Retry) are excluded entirely —
 *   "Explicit rerun requested by CEO" is always allowed.
 * - A group where any job was applied or rejected is excluded — "CEO
 *   rejected previous result" is an active human decision, not silent
 *   unattended repetition, and an applied job means it already converged.
 */
function detectExecutionLoops(jobs: DevelopmentJob[]): EngineeringFinding[] {
  const recent = jobs.slice(0, 5).filter(j => !j.explicitRerun)
  const groups = new Map<string, DevelopmentJob[]>()
  for (const j of recent) {
    const key = j.executionIdentityKey || `legacy:${j.id}`
    const group = groups.get(key) ?? []
    group.push(j)
    groups.set(key, group)
  }

  const findings: EngineeringFinding[] = []
  for (const group of groups.values()) {
    if (group.length < 2) continue
    if (group.some(j => j.appliedAt || j.rejectedAt)) continue
    const sample = group[0]
    findings.push({
      module: 'Runtime',
      category: 'Execution Loop',
      severity: 'High',
      title: 'The same execution identity was attempted repeatedly without completing',
      evidence: `Batch ${sample.batchId || 'unassigned'} (objective: "${sample.objective}") ran ${group.length} times in the last ${recent.length} runtime jobs with no repository, batch, or knowledge change, and none applied.`,
      location: null,
      recommendation: "This execution isn't converging under an unchanged execution identity — break it into a smaller task or investigate why it keeps failing to complete.",
    })
  }
  return findings
}

function detectStalledDevelopment(jobs: DevelopmentJob[]): EngineeringFinding[] {
  if (jobs.length === 0) return []
  const lastApplied = jobs.find(j => j.appliedAt)
  if (lastApplied) return []

  const oldestConsidered = jobs[jobs.length - 1]
  const age = daysSince(oldestConsidered.createdAt)
  if (age < STALLED_DAYS) return []

  return [
    {
      module: 'Runtime',
      category: 'Stalled Development',
      severity: 'Medium',
      title: 'No runtime execution has been applied recently',
      evidence: `0 of ${jobs.length} recorded runtime jobs have appliedAt set; the oldest is ${age} days old.`,
      location: null,
      recommendation: 'Investigate why recent runtime executions have not resulted in an applied change.',
    },
  ]
}

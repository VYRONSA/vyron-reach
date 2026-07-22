import type { ProjectExecutionState } from '../director/directorRuntimeTypes'
import type { EngineeringHealth, RiskLevel } from '../director/assessment/assessmentTypes'
import type { ProjectStatus } from '../projectsData'
import type { ProjectEligibility, ProjectSchedulingInfo, SchedulingFactor } from './schedulerTypes'

/**
 * Eligibility: whether the Scheduler may even consider starting/resuming
 * this project's Director this cycle. Blocked/Waiting-for-CEO projects
 * are never touched here — "Skip blocked projects" and the CEO-approval
 * gate every earlier milestone protects are both honored by simply never
 * calling startServerDirector/resumeServerDirector for them, not by any
 * new locking of their own. `awaitingExecutiveGo` (from
 * lib/dev/initiation/executiveControl.ts's isAwaitingExecutiveGoDecision)
 * is checked before the work check for the same reason: Executive Go /
 * Hold Control's whole point is that a Held-or-undecided project must
 * never start on its own, regardless of how much work is queued up and
 * waiting for it.
 */
export function evaluateEligibility(directorState: ProjectExecutionState, hasAvailableWork: boolean, awaitingExecutiveGo: boolean): ProjectEligibility {
  if (directorState === 'Running' || directorState === 'Planning') return 'Running'
  if (directorState === 'Blocked') return 'Blocked'
  if (directorState === 'Waiting for CEO') return 'WaitingForCeo'
  if (awaitingExecutiveGo) return 'AwaitingGo'
  if (!hasAvailableWork) return directorState === 'Completed' ? 'Completed' : 'NoWork'
  return 'Eligible'
}

const HEALTH_WEIGHT: Record<EngineeringHealth, number> = {
  Critical: 100,
  'At Risk': 70,
  'Attention Required': 40,
  Healthy: 10,
}

const RISK_WEIGHT: Record<RiskLevel, number> = { High: 60, Medium: 30, Low: 5 }

const STATUS_WEIGHT: Record<ProjectStatus, number> = { active: 50, planning: 30, paused: 10, complete: 0 }

/**
 * A High recovery-frequency risk is the same signal that can also pull
 * assessment.engineeringHealth up toward 'At Risk' (Critical requires a
 * core quality gate failing too, which recovery frequency alone never
 * causes — so the worst case is a Healthy→At Risk swing, +60 points).
 * This penalty must outweigh that swing on its own, or a flaky project
 * would net-INCREASE its own priority by crashing more, exactly the
 * opposite of "deprioritize until stabilized."
 */
const RECOVERY_PENALTY: Record<RiskLevel, number> = { High: -100, Medium: -30, Low: 0 }

/** Never having run at all outranks any bounded combination of health/risk/status factors below — a project's first run must never be indefinitely deferred by an ongoing stream of re-runs elsewhere. */
const NEVER_RUN_BONUS = 10_000

export type SchedulingFactorInputs = {
  project: string
  engineeringHealth: EngineeringHealth
  riskLevel: RiskLevel
  outstandingCeoDecisions: number
  projectStatus: ProjectStatus
  recoveryFrequencyRisk: RiskLevel
  lastExecutedAt: string | null
  /** Explicit reference time, not read internally via Date.now() — this is what keeps computePriorityScore a pure function: the same inputs (including the same `now`) always produce the same score, restart or not. The concept involves time; the implementation never hides a wall-clock read inside it. */
  now: string
}

/**
 * The deterministic scheduling priority score — a pure function of
 * SchedulingFactorInputs. Every factor the mission lists is represented:
 * Outstanding CEO approvals (a residual signal even for otherwise-eligible
 * projects), Engineering Health, Risk Level, Project priority (derived
 * from the existing Project.status field — no new Planning Service
 * schema needed), Recent execution (the staleness/fairness term below),
 * and Recovery state (a stability penalty from the Assessment Service's
 * own Recovery Frequency risk factor — reused, not reinvented). "Blocked
 * state" and "Queued work" are eligibility gates (see evaluateEligibility
 * above), not scoring terms — an ineligible project is never scored at
 * all for scheduling purposes.
 */
export function computePriorityScore(inputs: SchedulingFactorInputs): { score: number; factors: SchedulingFactor[] } {
  const health = HEALTH_WEIGHT[inputs.engineeringHealth]
  const risk = RISK_WEIGHT[inputs.riskLevel]
  const status = STATUS_WEIGHT[inputs.projectStatus]
  const recoveryPenalty = RECOVERY_PENALTY[inputs.recoveryFrequencyRisk]
  const ceoDecisions = Math.min(inputs.outstandingCeoDecisions, 5) * 5
  const staleness = computeStalenessBonus(inputs.lastExecutedAt, inputs.now)

  const factors: SchedulingFactor[] = [
    { name: 'Engineering Health', value: health, detail: inputs.engineeringHealth },
    { name: 'Risk Level', value: risk, detail: inputs.riskLevel },
    { name: 'Project Priority', value: status, detail: `status: ${inputs.projectStatus}` },
    { name: 'Recovery State', value: recoveryPenalty, detail: `recovery frequency risk: ${inputs.recoveryFrequencyRisk}` },
    { name: 'Outstanding CEO Decisions', value: ceoDecisions, detail: `${inputs.outstandingCeoDecisions} open` },
    { name: 'Recent Execution', value: staleness, detail: inputs.lastExecutedAt ? `last ran ${inputs.lastExecutedAt}` : 'never run' },
  ]

  const score = health + risk + status + recoveryPenalty + ceoDecisions + staleness
  return { score, factors }
}

/**
 * Fairness / anti-starvation: grows linearly and unboundedly with
 * elapsed wait time (1 point per minute), so no ceiling on the other
 * factors (their maximum possible combined value is fixed and bounded)
 * can ever permanently outrank a project that has simply waited long
 * enough — "lower-priority projects must eventually receive execution
 * time" is a mathematical guarantee here, not a hope.
 */
function computeStalenessBonus(lastExecutedAt: string | null, now: string): number {
  if (!lastExecutedAt) return NEVER_RUN_BONUS
  const elapsedMs = Math.max(0, new Date(now).getTime() - new Date(lastExecutedAt).getTime())
  return elapsedMs / 60_000
}

/** Ranks a set of already-scored projects deterministically — ties broken by project slug so the ordering never depends on array/object iteration order, which JS does not otherwise guarantee to be stable across environments for all cases. */
export function rankProjects(infos: ProjectSchedulingInfo[]): ProjectSchedulingInfo[] {
  return [...infos].sort((a, b) => b.priorityScore - a.priorityScore || a.project.localeCompare(b.project))
}

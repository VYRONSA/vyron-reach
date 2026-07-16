import { getProjects, type Project } from './projectsData'
import { getMilestones, type Milestone } from './milestonesStorage'
import { getBatches, type Batch } from './batchesStorage'
import { outstandingDebt } from './technicalDebtStorage'
import { openHighRisks } from './risksStorage'
import { getDevelopmentSession, type DevelopmentSession, type DevelopmentReadiness } from './developmentOrchestrator'
import type { ProjectIntelligenceContext } from './projectIntelligence'

export type DependencyBlockerType = 'Batch Dependency' | 'Technical Debt' | 'Risk' | 'Missing Information'
export type DependencySeverity = 'Warning' | 'Critical'

/**
 * A single blocking condition. Every blocker here is read straight off an
 * existing record's existing fields (batch sequencing, debt priority, risk
 * severity, session completeness) — nothing is inferred beyond what those
 * fields already assert.
 */
export type DevelopmentBlocker = {
  type: DependencyBlockerType
  project: string
  relatedMilestone: string
  relatedBatch: string
  description: string
  severity: DependencySeverity
  href: string
}

/** One unit of executable work — currently always a batch, the only unit VYRON DEV sequences explicitly. */
export type DependencyWorkItem = {
  project: string
  relatedMilestone: string
  batchId: string
  batchNumber: string
  label: string
  href: string
}

/**
 * A milestone-to-milestone sequencing signal derived from start/target
 * dates within the same project. Only emitted when both dates are
 * genuinely set and unambiguously order the pair — sparse or missing
 * dates simply produce no dependency, rather than a guessed one.
 */
export type MilestoneDependency = {
  project: string
  milestoneId: string
  dependsOnMilestoneId: string
  reason: string
}

export type CriticalPathProject = {
  project: string
  readiness: DevelopmentReadiness
  reason: string
}

export type DevelopmentDependencyStatus = {
  blockers: DevelopmentBlocker[]
  milestoneDependencies: MilestoneDependency[]
  readyWork: DependencyWorkItem[]
  waitingWork: DependencyWorkItem[]
  criticalPathProject: CriticalPathProject | null
  overallCriticalPath: DependencyWorkItem[]
  recommendedNextExecutableTask: DependencyWorkItem | null
}

function batchLabel(b: Batch): string {
  return `Batch ${b.batchNumber}${b.objective ? `: ${b.objective}` : ''}`
}

/** Numeric when batchNumber parses cleanly (the common case, e.g. "6", "7"); undefined otherwise so callers can fall back to creation order. */
function parsedBatchNumber(b: Batch): number | undefined {
  const n = Number(b.batchNumber)
  return Number.isFinite(n) ? n : undefined
}

/**
 * Batches are the only unit VYRON DEV sequences explicitly (batchNumber
 * within a milestone). A batch is "ready" once it's the first non-Complete
 * batch in its milestone's sequence; every later non-Complete batch in that
 * same milestone is "waiting" on that first one. Batches with no milestone
 * assigned have no sequencing constraint and are always ready. Batches
 * whose milestone reference doesn't resolve to a real milestone are
 * excluded entirely — there is no project to attribute them to without
 * inventing one.
 */
function computeBatchWork(
  milestones: Milestone[],
  batches: Batch[]
): { blockers: DevelopmentBlocker[]; readyWork: DependencyWorkItem[]; waitingWork: DependencyWorkItem[] } {
  const milestoneById = new Map(milestones.map(m => [m.id, m]))
  const blockers: DevelopmentBlocker[] = []
  const readyWork: DependencyWorkItem[] = []
  const waitingWork: DependencyWorkItem[] = []

  const byMilestone = new Map<string, Batch[]>()
  const unassigned: Batch[] = []
  for (const b of batches) {
    if (b.status === 'Complete') continue
    if (!b.milestone) {
      unassigned.push(b)
      continue
    }
    if (!milestoneById.has(b.milestone)) continue
    if (!byMilestone.has(b.milestone)) byMilestone.set(b.milestone, [])
    byMilestone.get(b.milestone)!.push(b)
  }

  for (const b of unassigned) {
    readyWork.push({ project: '', relatedMilestone: '', batchId: b.id, batchNumber: b.batchNumber, label: batchLabel(b), href: `/dev/batches?focus=${b.id}` })
  }

  for (const [milestoneId, group] of byMilestone) {
    const milestone = milestoneById.get(milestoneId)!
    const project = milestone.project

    const ordered = [...group].sort((a, b) => {
      const an = parsedBatchNumber(a)
      const bn = parsedBatchNumber(b)
      if (an !== undefined && bn !== undefined) return an - bn
      return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0
    })

    let blockingBatch: Batch | null = null
    for (const batch of ordered) {
      const item: DependencyWorkItem = {
        project,
        relatedMilestone: milestoneId,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        label: batchLabel(batch),
        href: `/dev/batches?focus=${batch.id}`,
      }
      if (blockingBatch === null) {
        readyWork.push(item)
        blockingBatch = batch
      } else {
        waitingWork.push(item)
        blockers.push({
          type: 'Batch Dependency',
          project,
          relatedMilestone: milestoneId,
          relatedBatch: batch.id,
          description: `Batch ${batch.batchNumber} cannot start until Batch ${blockingBatch.batchNumber} is complete.`,
          severity: 'Warning',
          href: `/dev/batches?focus=${batch.id}`,
        })
      }
    }
  }

  return { blockers, readyWork, waitingWork }
}

/**
 * Technical debt items with High priority that aren't yet Resolved are
 * treated as blocking — reusing the priority convention the AI Planning
 * Engine already established (High-priority debt surfaces first there
 * too), not inventing a new severity meaning.
 */
function computeTechnicalDebtBlockers(): DevelopmentBlocker[] {
  return outstandingDebt()
    .filter(d => d.priority === 'High')
    .map(d => ({
      type: 'Technical Debt' as const,
      project: d.project,
      relatedMilestone: '',
      relatedBatch: d.relatedBatch,
      description: `High-priority technical debt "${d.title}" is unresolved.`,
      severity: 'Critical' as const,
      href: `/dev/technical-debt?focus=${d.id}`,
    }))
}

/** Reuses risksStorage's own openHighRisks() rather than re-deriving "what counts as a blocking risk". */
function computeRiskBlockers(): DevelopmentBlocker[] {
  return openHighRisks().map(r => ({
    type: 'Risk' as const,
    project: r.project,
    relatedMilestone: r.relatedMilestone,
    relatedBatch: '',
    description: `High-severity risk "${r.title}" is open.`,
    severity: 'Critical' as const,
    href: `/dev/risks?focus=${r.id}`,
  }))
}

/**
 * Surfaces the same missing-information facts computeDevelopmentReadiness
 * already checks (hasMilestone/hasBatch/hasObjective) — read off the
 * already-computed Session, not recalculated.
 */
function computeMissingInfoBlockers(projects: Project[], sessionByProject: Map<string, DevelopmentSession>): DevelopmentBlocker[] {
  const blockers: DevelopmentBlocker[] = []
  for (const p of projects) {
    const session = sessionByProject.get(p.slug)
    if (!session) continue
    const href = `/dev/projects/${p.slug}`
    if (!session.currentMilestone) {
      blockers.push({ type: 'Missing Information', project: p.slug, relatedMilestone: '', relatedBatch: '', description: `${p.name} has no current milestone set.`, severity: 'Warning', href })
      continue
    }
    if (!session.currentBatch) {
      blockers.push({ type: 'Missing Information', project: p.slug, relatedMilestone: session.currentMilestone.id, relatedBatch: '', description: `${p.name} has no active batch set.`, severity: 'Warning', href })
    }
    if (!session.currentObjective) {
      blockers.push({ type: 'Missing Information', project: p.slug, relatedMilestone: session.currentMilestone.id, relatedBatch: '', description: `${p.name} has no current objective set.`, severity: 'Warning', href })
    }
  }
  return blockers
}

/**
 * Milestones have no explicit "depends on" field, so the only genuinely
 * data-driven sequencing signal is start/target dates within the same
 * project: if milestone A's target date is on or after milestone B's
 * start date and A isn't Complete, B is sequenced after an unfinished A.
 * Conservative by design — pairs with missing or ambiguous dates simply
 * produce no dependency.
 */
function computeMilestoneDependencies(projects: Project[], milestones: Milestone[]): MilestoneDependency[] {
  const deps: MilestoneDependency[] = []
  for (const p of projects) {
    const group = milestones.filter(m => m.project === p.slug)
    for (const b of group) {
      if (!b.startDate) continue
      for (const a of group) {
        if (a.id === b.id || !a.targetDate || a.status === 'Complete') continue
        if (a.targetDate <= b.startDate) {
          deps.push({
            project: p.slug,
            milestoneId: b.id,
            dependsOnMilestoneId: a.id,
            reason: `"${b.title}" is scheduled on or after "${a.title}"'s target date, which hasn't been reached.`,
          })
        }
      }
    }
  }
  return deps
}

const READINESS_RANK: Record<DevelopmentReadiness, number> = { Blocked: 2, 'Needs Review': 1, Ready: 0 }

/**
 * The project in the worst state, ranked by developmentReadiness first and
 * blocker count as a tie-breaker. Returns null when every project is Ready
 * with no blockers — an honest "nothing is critical right now" rather than
 * forcing a pick.
 */
function computeCriticalPathProject(
  projects: Project[],
  sessionByProject: Map<string, DevelopmentSession>,
  blockers: DevelopmentBlocker[]
): CriticalPathProject | null {
  const blockerCountByProject = new Map<string, number>()
  for (const b of blockers) {
    if (!b.project) continue
    blockerCountByProject.set(b.project, (blockerCountByProject.get(b.project) ?? 0) + 1)
  }

  let best: CriticalPathProject | null = null
  let bestScore = -1
  for (const p of projects) {
    const session = sessionByProject.get(p.slug)
    if (!session) continue
    const blockerCount = blockerCountByProject.get(p.slug) ?? 0
    if (session.developmentReadiness === 'Ready' && blockerCount === 0) continue

    const score = READINESS_RANK[session.developmentReadiness] * 1000 + blockerCount
    if (score > bestScore) {
      bestScore = score
      best = {
        project: p.slug,
        readiness: session.developmentReadiness,
        reason:
          blockerCount > 0
            ? `${p.name} has ${blockerCount} active blocker${blockerCount === 1 ? '' : 's'} and is ${session.developmentReadiness}.`
            : `${p.name} is ${session.developmentReadiness}.`,
      }
    }
  }
  return best
}

/** Ready work ordered with the critical-path project's items first, then by project, then by sequence — the chain most worth clearing next. */
function computeOverallCriticalPath(readyWork: DependencyWorkItem[], criticalPathProject: CriticalPathProject | null): DependencyWorkItem[] {
  return [...readyWork].sort((a, b) => {
    if (criticalPathProject) {
      const aCritical = a.project === criticalPathProject.project ? 0 : 1
      const bCritical = b.project === criticalPathProject.project ? 0 : 1
      if (aCritical !== bCritical) return aCritical - bCritical
    }
    if (a.project !== b.project) return a.project < b.project ? -1 : 1
    return 0
  })
}

/**
 * The Development Dependency Intelligence Engine — pure composition over
 * existing stores and the existing Development Session, computed once
 * across every tracked project. It never invents a relationship: batch
 * sequencing comes from batchNumber + milestone grouping that already
 * exists, milestone sequencing comes from start/target dates that already
 * exist, blocking debt/risk reuse the priority/severity fields those
 * stores already expose, and missing-information blockers are read off an
 * already-computed Session. Nothing is written, nothing calls an AI, and
 * calling this twice with the same underlying data always returns the
 * same result.
 */
export function getDevelopmentDependencyStatus(context: ProjectIntelligenceContext = {}): DevelopmentDependencyStatus {
  const projects = getProjects().filter(p => !p.archived)
  const milestones = getMilestones().filter(m => !m.archived)
  const batches = getBatches().filter(b => !b.archived)

  const sessionByProject = new Map<string, DevelopmentSession>()
  for (const p of projects) sessionByProject.set(p.slug, getDevelopmentSession(p.slug, context))

  const { blockers: batchBlockers, readyWork, waitingWork } = computeBatchWork(milestones, batches)
  const debtBlockers = computeTechnicalDebtBlockers()
  const riskBlockers = computeRiskBlockers()
  const missingInfoBlockers = computeMissingInfoBlockers(projects, sessionByProject)
  const milestoneDependencies = computeMilestoneDependencies(projects, milestones)

  const blockers = [...batchBlockers, ...debtBlockers, ...riskBlockers, ...missingInfoBlockers]
  const criticalPathProject = computeCriticalPathProject(projects, sessionByProject, blockers)
  const overallCriticalPath = computeOverallCriticalPath(readyWork, criticalPathProject)

  return {
    blockers,
    milestoneDependencies,
    readyWork,
    waitingWork,
    criticalPathProject,
    overallCriticalPath,
    recommendedNextExecutableTask: overallCriticalPath[0] ?? null,
  }
}

/**
 * Project-scoped view for the Executive Command Centre. Blockers/ready/
 * waiting/milestone-dependencies are filtered to this project; critical
 * path fields stay global (like Git/Build/Deployment events) since they're
 * inherently cross-project comparisons, not something a single project's
 * data alone can answer.
 */
export function developmentDependencyStatusForProject(slug: string, context: ProjectIntelligenceContext = {}): DevelopmentDependencyStatus {
  const status = getDevelopmentDependencyStatus(context)
  return {
    blockers: status.blockers.filter(b => b.project === slug),
    milestoneDependencies: status.milestoneDependencies.filter(d => d.project === slug),
    readyWork: status.readyWork.filter(w => w.project === slug),
    waitingWork: status.waitingWork.filter(w => w.project === slug),
    criticalPathProject: status.criticalPathProject,
    overallCriticalPath: status.overallCriticalPath,
    recommendedNextExecutableTask: status.recommendedNextExecutableTask,
  }
}

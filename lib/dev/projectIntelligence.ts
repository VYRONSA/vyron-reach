import { getProjectBySlug, type Project } from './projectsData'
import { getCurrentMilestone, getMilestoneProgress, milestonesForProject, type Milestone } from './milestonesStorage'
import { getCurrentBatchForProject, type Batch } from './batchesStorage'
import { tasksForProject, type Task } from './queueStorage'
import { decisionsForProject, type Decision } from './decisionsStorage'
import { openRisksForProject, type Risk } from './risksStorage'
import { debtForProject, type TechnicalDebt } from './technicalDebtStorage'
import { getActivityEvents, type ActivityEvent } from './activityFeed'
import { computeProjectHealth, type ProjectHealth } from './projectHealth'
import { handoversForProject, getLatestHandover, type Handover } from './handoverStorage'
import type { GitIntelligence } from './gitIntelligence'
import type { DeploymentIntelligence } from './deploymentIntelligence'
import type { BuildIntelligence } from './buildIntelligence'

export type ProductionReadiness = 'Ready' | 'Needs Review' | 'Blocked'

export type ProjectIntelligence = {
  project: Project | undefined
  currentMilestone: Milestone | null
  currentBatch: Batch | null
  currentTask: Task | null
  currentPhase: string
  progress: number
  productionReadiness: ProductionReadiness
  nextRecommendedTask: Task | null
  health: ProjectHealth
  buildStatus: string
  typescriptStatus: string
  openRisks: Risk[]
  outstandingDebt: TechnicalDebt[]
  recentActivity: ActivityEvent[]
  recentDecisions: Decision[]
  recentClaudeHandovers: Handover[]
  latestHandover: Handover | null
  lastRecommendation: string | null
}

/**
 * Build/TypeScript status live in lastValidation.json, read via fs in
 * systemInfo.ts — server-only. Callers that already have that data (the
 * dashboard's Server Component) pass it through here; everyone else gets
 * 'Unknown' rather than a guess or a duplicated filesystem read.
 */
export type ProjectIntelligenceContext = {
  buildStatus?: string
  typescriptStatus?: string
  git?: GitIntelligence
  deployment?: DeploymentIntelligence
  build?: BuildIntelligence
}

function pickNextRecommendedTask(openTasks: Task[], currentTask: Task | null): Task | null {
  const candidates = openTasks.filter(t => t.id !== currentTask?.id && t.status !== 'blocked')
  return candidates.find(t => t.priority === 'high') ?? candidates.find(t => t.priority === 'medium') ?? candidates[0] ?? null
}

function computeProductionReadiness(buildStatus: string, typescriptStatus: string, health: ProjectHealth): ProductionReadiness {
  if (buildStatus === 'Failing' || typescriptStatus === 'Failing') return 'Blocked'
  if (health.label === 'Critical') return 'Blocked'
  if (health.label === 'Attention Required') return 'Needs Review'
  return 'Ready'
}

/**
 * The single source of truth for "what's going on" with a project — composes
 * the existing local stores into one snapshot instead of each screen
 * recomputing its own version. Pure and synchronous; safe to call from
 * client components since it never touches the filesystem.
 *
 * This is the reuse point for future Git/Build/Deployment/Claude intelligence:
 * they feed additional signals in through `context` (as buildStatus/
 * typescriptStatus already do) rather than the engine reaching out for them.
 */
export function getProjectIntelligence(slug: string, context: ProjectIntelligenceContext = {}): ProjectIntelligence {
  const project = getProjectBySlug(slug)
  /**
   * Current position is batch-first: the current batch is the first
   * incomplete batch in engineering sequence (getCurrentBatchForProject),
   * and the current milestone is THAT batch's milestone — never picked
   * independently. Only when no batch exists yet (a project with
   * milestones but nothing queued under them) does milestone selection
   * fall back to its own sequence-based status search.
   */
  const currentBatch = getCurrentBatchForProject(slug)
  const currentMilestone = currentBatch ? (milestonesForProject(slug).find(m => m.id === currentBatch.milestone) ?? null) : getCurrentMilestone(slug)
  const openTasks = tasksForProject(slug).filter(t => t.status !== 'done')
  const currentTask = openTasks.find(t => t.status === 'in-progress') ?? null
  const health = computeProjectHealth(slug)
  const buildStatus = context.buildStatus ?? 'Unknown'
  const typescriptStatus = context.typescriptStatus ?? 'Unknown'

  const latestHandover = getLatestHandover(slug)
  const recentClaudeHandovers = [...handoversForProject(slug)]
    .sort((a, b) => (a.date === b.date ? (a.createdAt < b.createdAt ? 1 : -1) : a.date < b.date ? 1 : -1))
    .slice(0, 5)

  return {
    project,
    currentMilestone,
    currentBatch,
    currentTask,
    currentPhase: currentMilestone?.phase || 'Unknown',
    progress: getMilestoneProgress(slug) ?? project?.progress ?? 0,
    productionReadiness: computeProductionReadiness(buildStatus, typescriptStatus, health),
    nextRecommendedTask: pickNextRecommendedTask(openTasks, currentTask),
    health,
    buildStatus,
    typescriptStatus,
    openRisks: openRisksForProject(slug),
    outstandingDebt: debtForProject(slug).filter(d => d.status !== 'Resolved'),
    recentActivity: getActivityEvents()
      .filter(e => e.project === slug)
      .slice(0, 5),
    recentDecisions: [...decisionsForProject(slug)].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 5),
    recentClaudeHandovers,
    latestHandover,
    lastRecommendation: latestHandover?.recommendations.trim() || null,
  }
}

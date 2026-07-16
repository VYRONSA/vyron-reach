import { tasksForProject, type Task, type TaskPriority } from './queueStorage'
import { risksForMilestone, isOpenRisk, type Risk } from './risksStorage'
import { debtForBatch, type TechnicalDebt } from './technicalDebtStorage'
import { getProjectIntelligence, type ProjectIntelligence, type ProjectIntelligenceContext } from './projectIntelligence'
import type { Handover } from './handoverStorage'

export type CompletionTrend = 'Accelerating' | 'Steady' | 'Slowing' | 'Stalled' | 'No Data'

/**
 * Reserved for when Task gains a `dependsOn` field — there's no dependency
 * data to derive today, so this always resolves empty rather than guessing
 * at relationships from titles/notes.
 */
export type TaskDependency = {
  taskId: string
  dependsOnTaskId: string
}

export type DevelopmentIntelligence = {
  activeTask: Task | null
  upcomingTasks: Task[]
  blockedTasks: Task[]
  completedTasks: Task[]
  velocity: number // average tasks completed per day, trailing 7 days
  completedToday: number
  completedThisWeek: number
  completionTrend: CompletionTrend
  focusArea: string | null
  objective: string | null
  stage: string
  activeRisks: Risk[]
  activeDebt: TechnicalDebt[]
  taskDependencies: TaskDependency[]
  suggestedNextTask: Task | null
  latestHandover: Handover | null
  recommendedNextTask: string | null // latest handover's suggested next batch
  developmentRecommendation: string | null // latest handover's recommendations
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 }

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function sortUpcoming(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const weightDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]
    if (weightDiff !== 0) return weightDiff
    return a.createdAt < b.createdAt ? -1 : 1
  })
}

function sortMostRecentlyCompleted(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
}

function computeTrend(completedTasks: Task[]): CompletionTrend {
  if (completedTasks.length === 0) return 'No Data'
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000
  const thisWeekStart = new Date(Date.now() - oneWeekMs).toISOString()
  const priorWeekStart = new Date(Date.now() - 2 * oneWeekMs).toISOString()
  const thisWeek = completedTasks.filter(t => t.updatedAt >= thisWeekStart).length
  const priorWeek = completedTasks.filter(t => t.updatedAt >= priorWeekStart && t.updatedAt < thisWeekStart).length
  if (thisWeek === 0 && priorWeek === 0) return 'Stalled'
  if (thisWeek > priorWeek) return 'Accelerating'
  if (thisWeek < priorWeek) return 'Slowing'
  return 'Steady'
}

function resolveFocusArea(intel: ProjectIntelligence): string | null {
  return intel.currentMilestone?.title || intel.project?.tagline || null
}

function resolveObjective(intel: ProjectIntelligence): string | null {
  const batchObjective = intel.currentBatch?.objective?.trim()
  const milestoneDescription = intel.currentMilestone?.description?.trim()
  return batchObjective || milestoneDescription || null
}

function resolveStage(intel: ProjectIntelligence): string {
  if (intel.currentMilestone) return intel.currentMilestone.status
  if (intel.currentBatch) {
    return intel.currentBatch.status === 'Active' ? 'In Progress' : intel.currentBatch.status
  }
  return 'Not Started'
}

/** Risks tied to the current milestone when that link exists; otherwise every open project risk. */
function resolveActiveRisks(intel: ProjectIntelligence): Risk[] {
  if (!intel.currentMilestone) return intel.openRisks
  const linked = risksForMilestone(intel.currentMilestone.id).filter(isOpenRisk)
  return linked.length > 0 ? linked : intel.openRisks
}

/** Debt tied to the current batch when that link exists; otherwise every outstanding project debt item. */
function resolveActiveDebt(intel: ProjectIntelligence): TechnicalDebt[] {
  if (!intel.currentBatch) return intel.outstandingDebt
  const linked = debtForBatch(intel.currentBatch.id).filter(d => d.status !== 'Resolved')
  return linked.length > 0 ? linked : intel.outstandingDebt
}

/**
 * Derives task-and-work-level state for a project — how development is
 * actually going, not just what the project's metadata says. Composes the
 * Project Intelligence Engine rather than recomputing current task / next
 * task itself, so the two engines never disagree.
 *
 * Pass an already-computed ProjectIntelligence (and its context) when the
 * caller has one, to avoid recomputing it twice on the same page.
 */
export function getDevelopmentIntelligence(
  slug: string,
  projectIntel?: ProjectIntelligence,
  context: ProjectIntelligenceContext = {}
): DevelopmentIntelligence {
  const intel = projectIntel ?? getProjectIntelligence(slug, context)

  const allTasks = tasksForProject(slug)
  const upcomingTasks = sortUpcoming(allTasks.filter(t => t.status === 'todo'))
  const blockedTasks = allTasks.filter(t => t.status === 'blocked')
  const completedTasks = sortMostRecentlyCompleted(allTasks.filter(t => t.status === 'done'))

  const today = todayISO()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const completedToday = completedTasks.filter(t => t.updatedAt.slice(0, 10) === today).length
  const completedThisWeek = completedTasks.filter(t => t.updatedAt >= sevenDaysAgo).length

  return {
    activeTask: intel.currentTask,
    upcomingTasks,
    blockedTasks,
    completedTasks,
    velocity: Math.round((completedThisWeek / 7) * 10) / 10,
    completedToday,
    completedThisWeek,
    completionTrend: computeTrend(completedTasks),
    focusArea: resolveFocusArea(intel),
    objective: resolveObjective(intel),
    stage: resolveStage(intel),
    activeRisks: resolveActiveRisks(intel),
    activeDebt: resolveActiveDebt(intel),
    taskDependencies: [],
    suggestedNextTask: intel.nextRecommendedTask,
    latestHandover: intel.latestHandover,
    recommendedNextTask: intel.latestHandover?.nextSuggestedBatch.trim() || null,
    developmentRecommendation: intel.lastRecommendation,
  }
}

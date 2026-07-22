import type { DevelopmentSession } from './developmentOrchestrator'
import type { DevelopmentPlan } from './aiPlanningEngine'
import type { DevelopmentDependencyStatus, DevelopmentBlocker, DependencyBlockerType } from './developmentDependencyEngine'
import type { DevelopmentEvent } from './developmentEventEngine'
import type { DevelopmentConversationMemory } from './developmentConversationMemoryEngine'

export type ActionPriority = 'Critical' | 'High' | 'Medium' | 'Low'

export type ActionCategory =
  | 'Development'
  | 'Validation'
  | 'Dependencies'
  | 'Git'
  | 'Deployment'
  | 'Risk'
  | 'Technical Debt'
  | 'Planning'
  | 'Administration'

export type ExecutiveAction = {
  priority: ActionPriority
  category: ActionCategory
  title: string
  description: string
  reason: string
  sourceEngine: string
  recommendedAction: string
  blocking: boolean
  estimatedImpact: string
  href: string
}

export type ExecutiveFocus =
  | 'BUILD HEALTH'
  | 'CURRENT BATCH'
  | 'BLOCKERS'
  | 'DEPENDENCIES'
  | 'DEPLOYMENT'
  | 'TECHNICAL DEBT'
  | 'PLANNING'
  | 'READY FOR DEVELOPMENT'

export type ExecutiveActionQueue = {
  /** Full prioritized list — Critical first, Low last. The Executive Command Centre truncates for display; nothing here truncates it itself. */
  actions: ExecutiveAction[]
  focus: ExecutiveFocus
  /** The single highest-priority Critical/High action, or null once none remain — Mission Control's "Today's Executive Action" and its ready/blocked mode both key off this exact value. */
  topAction: ExecutiveAction | null
}

const IMPACT: Record<ActionPriority, string> = {
  Critical: 'Blocks all further development until resolved.',
  High: 'Slows progress toward the current milestone.',
  Medium: 'No immediate blocker, but should be addressed soon.',
  Low: 'Minor — safe to defer.',
}

/**
 * Exported for direct unit testing (PRAT-1 DEF-001 — Executive Build
 * Validation Navigation) — `category: 'Validation'` and
 * `sourceEngine: 'Build Intelligence'` are the exact, stable signal
 * components/dev/MissionControl.tsx and ExecutiveActionQueuePanel.tsx key
 * off to open the Executive Build Failure Report (DEF-004) instead of
 * following `href` to the generic Git & Build page; this test guards that
 * contract against silently drifting. getExecutiveActions remains the only
 * production caller.
 */
export function buildValidationActions(session: DevelopmentSession): ExecutiveAction[] {
  const actions: ExecutiveAction[] = []
  if (session.buildStatus === 'Failing') {
    actions.push({
      priority: 'Critical',
      category: 'Validation',
      title: 'Build Is Failing',
      description: 'The last recorded build did not pass.',
      reason: 'Build Status: Failing.',
      sourceEngine: 'Build Intelligence',
      recommendedAction: 'Run npm run build locally and fix the reported errors.',
      blocking: true,
      estimatedImpact: IMPACT.Critical,
      href: '/dev/git-build',
    })
  }
  if (session.typescriptStatus === 'Failing') {
    actions.push({
      priority: 'Critical',
      category: 'Validation',
      title: 'TypeScript Is Failing',
      description: 'The last recorded TypeScript check did not pass.',
      reason: 'TypeScript Status: Failing.',
      sourceEngine: 'Build Intelligence',
      recommendedAction: 'Run npx tsc --noEmit locally and fix the reported errors.',
      blocking: true,
      estimatedImpact: IMPACT.Critical,
      href: '/dev/git-build',
    })
  }
  return actions
}

/**
 * "Current batch blocked" (Critical) and "batch incomplete" (High) are
 * mutually exclusive for the same batch — a blocked batch is reported once,
 * as the more severe fact, rather than also being listed as merely
 * incomplete.
 */
function buildBatchActions(session: DevelopmentSession, dependencies: DevelopmentDependencyStatus, plan: DevelopmentPlan): ExecutiveAction[] {
  const batch = session.currentBatch
  if (!batch) return []

  const blockingEntry = dependencies.blockers.find(b => b.type === 'Batch Dependency' && b.relatedBatch === batch.id)
  if (blockingEntry) {
    return [
      {
        priority: 'Critical',
        category: 'Dependencies',
        title: `Batch ${batch.batchNumber} Is Blocked`,
        description: blockingEntry.description,
        reason: blockingEntry.description,
        sourceEngine: 'Development Dependency Intelligence',
        recommendedAction: 'Complete the blocking batch before continuing this one.',
        blocking: true,
        estimatedImpact: `Blocks Batch ${batch.batchNumber} from starting.`,
        href: blockingEntry.href,
      },
    ]
  }

  if (batch.status !== 'Complete') {
    return [
      {
        priority: 'High',
        category: 'Development',
        title: `Complete Batch ${batch.batchNumber}`,
        description: batch.objective || 'Continue implementing the current batch.',
        reason: `Batch ${batch.batchNumber} is not yet marked complete.`,
        sourceEngine: 'Self Development Engine',
        recommendedAction: plan.recommendedNextTask.task
          ? `Continue with: ${plan.recommendedNextTask.task.title}`
          : `Continue implementing Batch ${batch.batchNumber}'s objective.`,
        blocking: false,
        estimatedImpact: IMPACT.High,
        href: `/dev/batches?focus=${batch.id}`,
      },
    ]
  }

  return []
}

/**
 * Priority here follows this engine's own rule table (Critical risk / High
 * technical debt / Medium planning gap / Medium other batch dependency) —
 * deliberately independent of DevelopmentBlocker.severity, which the
 * Dependency Engine computes for a different purpose (ranking the overall
 * critical-path project). Reading blocker.type/description/href is plain
 * data access, not a re-derivation of the Dependency Engine's own logic.
 */
const BLOCKER_CATEGORY: Record<DependencyBlockerType, ActionCategory> = {
  'Batch Dependency': 'Dependencies',
  'Technical Debt': 'Technical Debt',
  Risk: 'Risk',
  'Missing Information': 'Planning',
}

function priorityForBlockerType(type: DependencyBlockerType): ActionPriority {
  if (type === 'Risk') return 'Critical'
  if (type === 'Technical Debt') return 'High'
  return 'Medium'
}

function recommendedActionForBlockerType(type: DependencyBlockerType): string {
  if (type === 'Risk') return 'Review and mitigate this risk.'
  if (type === 'Technical Debt') return 'Resolve this technical debt item.'
  if (type === 'Missing Information') return 'Set the missing information to unblock planning.'
  return 'Resolve the blocking batch before continuing.'
}

/** The current batch's own blocking entry is surfaced separately by buildBatchActions — excluded here to avoid listing it twice. */
function buildBlockerActions(blockers: DevelopmentBlocker[], currentBatchId: string | null): ExecutiveAction[] {
  return blockers
    .filter(b => !(b.type === 'Batch Dependency' && b.relatedBatch === currentBatchId))
    .map(b => {
      const priority = priorityForBlockerType(b.type)
      return {
        priority,
        category: BLOCKER_CATEGORY[b.type],
        title: b.type,
        description: b.description,
        reason: b.description,
        sourceEngine: 'Development Dependency Intelligence',
        recommendedAction: recommendedActionForBlockerType(b.type),
        blocking: priority === 'Critical',
        estimatedImpact: IMPACT[priority],
        href: b.href,
      }
    })
}

function buildGitActions(session: DevelopmentSession): ExecutiveAction[] {
  if (session.gitRepositoryStatus === 'Unavailable') {
    return [
      {
        priority: 'High',
        category: 'Git',
        title: 'Git Repository Unavailable',
        description: 'Git Intelligence could not read the repository.',
        reason: 'Repository Status: Unavailable.',
        sourceEngine: 'Git Intelligence',
        recommendedAction: 'Verify the repository is present and accessible.',
        blocking: false,
        estimatedImpact: IMPACT.High,
        href: '/dev/git-build',
      },
    ]
  }
  if (session.gitWorkingTreeStatus === 'Modified') {
    return [
      {
        priority: 'High',
        category: 'Git',
        title: 'Uncommitted Changes',
        description: `${session.gitChangedFileCount ?? 'Some'} file(s) changed and not committed.`,
        reason: 'Working Tree Status: Modified.',
        sourceEngine: 'Git Intelligence',
        recommendedAction: 'Review and commit outstanding changes.',
        blocking: false,
        estimatedImpact: IMPACT.High,
        href: '/dev/git-build',
      },
    ]
  }
  return []
}

function buildDeploymentActions(session: DevelopmentSession): ExecutiveAction[] {
  if (session.deploymentStatus !== 'Available') {
    return [
      {
        priority: 'High',
        category: 'Deployment',
        title: 'Deployment Not Configured',
        description: 'No deployment configuration was found for this project.',
        reason: 'Deployment Status: Not Configured.',
        sourceEngine: 'Deployment Intelligence',
        recommendedAction: 'Configure deployment for this project.',
        blocking: false,
        estimatedImpact: IMPACT.High,
        href: '/dev/git-build',
      },
    ]
  }
  if (session.deploymentReadiness === 'Blocked' || session.deploymentReadiness === 'Needs Review') {
    return [
      {
        priority: 'High',
        category: 'Deployment',
        title: 'Deployment Needs Attention',
        description: `Deployment readiness: ${session.deploymentReadiness}.`,
        reason: `Deployment Readiness: ${session.deploymentReadiness}.`,
        sourceEngine: 'Deployment Intelligence',
        recommendedAction: 'Review deployment readiness before the next release.',
        blocking: false,
        estimatedImpact: IMPACT.High,
        href: '/dev/git-build',
      },
    ]
  }
  return []
}

/**
 * Drift is a conclusion only the Conversation Memory Engine computes (not
 * derivable from session/dependencies alone), so it's read from `memory`
 * rather than re-checked here — the one place this engine genuinely needs
 * Memory's own analysis rather than just the raw facts underneath it.
 */
function buildPlanningActions(session: DevelopmentSession, memory: DevelopmentConversationMemory): ExecutiveAction[] {
  const actions: ExecutiveAction[] = []

  if (memory.drift !== 'No Drift') {
    const priority: ActionPriority = memory.drift === 'Major Drift' ? 'High' : 'Medium'
    actions.push({
      priority,
      category: 'Planning',
      title: `Development Drift Detected (${memory.drift})`,
      description: memory.driftExplanation,
      reason: memory.driftExplanation,
      sourceEngine: 'Development Conversation Memory',
      recommendedAction: `Review continuity before proceeding: ${memory.continuitySummary}`,
      blocking: false,
      estimatedImpact: IMPACT[priority],
      href: '/dev',
    })
  }

  if (session.suggestedNextBatch) {
    actions.push({
      priority: 'Medium',
      category: 'Planning',
      title: 'Suggested Next Batch',
      description: session.suggestedNextBatch,
      reason: 'Suggested in the latest Claude handover.',
      sourceEngine: 'Self Development Engine',
      recommendedAction: `Plan the next batch: ${session.suggestedNextBatch}`,
      blocking: false,
      estimatedImpact: IMPACT.Medium,
      href: '/dev/batches',
    })
  }

  if (session.previousRecommendations) {
    actions.push({
      priority: 'Medium',
      category: 'Planning',
      title: 'Outstanding Recommendation',
      description: session.previousRecommendations,
      reason: 'Recorded in the latest Claude handover.',
      sourceEngine: 'Development Session',
      recommendedAction: 'Review and act on the outstanding recommendation.',
      blocking: false,
      estimatedImpact: IMPACT.Medium,
      href: '/dev/handovers',
    })
  }

  return actions
}

/** Recent Notice-severity events (completions, closures, resolutions) surfaced as low-priority visibility items, not actions requiring work. */
function buildHousekeepingActions(events: DevelopmentEvent[]): ExecutiveAction[] {
  return events
    .filter(e => e.severity === 'Notice')
    .slice(0, 3)
    .map(e => ({
      priority: 'Low' as const,
      category: 'Administration' as const,
      title: e.type,
      description: e.description,
      reason: 'Recently completed.',
      sourceEngine: 'Development Event Engine',
      recommendedAction: 'No action needed — noted for visibility.',
      blocking: false,
      estimatedImpact: IMPACT.Low,
      href: e.href,
    }))
}

const PRIORITY_RANK: Record<ActionPriority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }

/** Derived from the already-sorted Critical/High actions rather than re-checking session/dependencies independently — one source of truth for "what's most urgent" instead of two answers that could disagree. */
function determineExecutiveFocus(blocking: ExecutiveAction[]): ExecutiveFocus {
  const top = blocking[0]
  if (!top) return 'READY FOR DEVELOPMENT'
  if (top.category === 'Validation') return 'BUILD HEALTH'
  if (top.category === 'Risk') return 'BLOCKERS'
  if (top.category === 'Dependencies' && top.priority === 'Critical') return 'BLOCKERS'
  if (top.category === 'Development' || top.category === 'Git') return 'CURRENT BATCH'
  if (top.category === 'Dependencies') return 'DEPENDENCIES'
  if (top.category === 'Deployment') return 'DEPLOYMENT'
  if (top.category === 'Technical Debt') return 'TECHNICAL DEBT'
  return 'PLANNING'
}

/**
 * The Executive Action Engine — an orchestration layer, not another
 * intelligence engine. It creates no new facts: every action is a
 * prioritized restatement of a fact an existing engine already computed
 * (Build/Git/Deployment status embedded on the Session, Dependency
 * Intelligence's blockers, the Conversation Memory Engine's drift
 * analysis, Development Events). Session/Plan/Dependencies/Events/Memory
 * are all required precomputed params — nothing here is called twice, and
 * nothing here calls a leaf engine (Git/Build/Deployment Intelligence)
 * directly, since Session already composed them once.
 */
export function getExecutiveActions(
  session: DevelopmentSession,
  plan: DevelopmentPlan,
  dependencies: DevelopmentDependencyStatus,
  events: DevelopmentEvent[],
  memory: DevelopmentConversationMemory
): ExecutiveActionQueue {
  const currentBatchId = session.currentBatch?.id ?? null

  const actions = [
    ...buildValidationActions(session),
    ...buildBatchActions(session, dependencies, plan),
    ...buildBlockerActions(dependencies.blockers, currentBatchId),
    ...buildGitActions(session),
    ...buildDeploymentActions(session),
    ...buildPlanningActions(session, memory),
    ...buildHousekeepingActions(events),
  ].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])

  const blocking = actions.filter(a => a.priority === 'Critical' || a.priority === 'High')

  return {
    actions,
    focus: determineExecutiveFocus(blocking),
    topAction: blocking[0] ?? null,
  }
}

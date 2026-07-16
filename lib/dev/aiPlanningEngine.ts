import type { Task, TaskPriority } from './queueStorage'
import { PRIORITY_LABEL } from './queueStorage'
import type { Risk } from './risksStorage'
import type { TechnicalDebt } from './technicalDebtStorage'
import { batchesForMilestone } from './batchesStorage'
import { getProjectIntelligence, type ProjectIntelligenceContext } from './projectIntelligence'
import { getDevelopmentIntelligence } from './developmentIntelligence'
import { getDevelopmentSession, type DevelopmentSession } from './developmentOrchestrator'

export type PriorityTier = 'Critical' | 'High' | 'Medium' | 'Low'

export type PriorityItem = {
  label: string
  tier: PriorityTier
  href: string
}

export type TaskRecommendation = {
  task: Task | null
  reason: string
}

export type BatchRecommendation = {
  label: string | null
  reason: string
}

export type ChecklistStatus = 'Passed' | 'Failed' | 'Attention' | 'Pending'

export type ChecklistItem = {
  label: string
  status: ChecklistStatus
}

/**
 * A deterministic, fully-assembled development plan for a project — the
 * Development Session translated into "what to do next" without any AI
 * involved. Every field is plain string/data templating over the Project
 * Intelligence, Development Intelligence, and Handover Intelligence engines
 * (via the Development Orchestrator).
 */
export type DevelopmentPlan = {
  currentGoal: string
  currentObjective: string | null
  recommendedNextTask: TaskRecommendation
  recommendedNextBatch: BatchRecommendation
  developmentPriorities: PriorityItem[]
  blockingRisks: Risk[]
  technicalDebt: TechnicalDebt[]
  validationChecklist: ChecklistItem[]
  gitChecklist: ChecklistItem[]
  deploymentChecklist: ChecklistItem[]
  buildChecklist: ChecklistItem[]
  definitionOfDone: string[]
  suggestedClaudePrompt: string
  executiveDecision: string
}

const PRIORITY_ORDER: PriorityTier[] = ['Critical', 'High', 'Medium', 'Low']

function buildCurrentGoal(session: DevelopmentSession): string {
  const projectName = session.project?.name ?? 'this project'
  if (session.currentBatch?.objective) {
    return `Complete Batch ${session.currentBatch.batchNumber} for ${projectName}: ${session.currentBatch.objective}`
  }
  if (session.currentMilestone) {
    return `Advance "${session.currentMilestone.title}" for ${projectName}.`
  }
  if (session.project) {
    return `Continue development on ${projectName}.`
  }
  return 'No project selected — choose a default project to generate a development goal.'
}

function deriveRecommendedNextTask(session: DevelopmentSession): TaskRecommendation {
  if (session.currentTask) {
    return { task: session.currentTask, reason: 'Continue the task already in progress.' }
  }
  if (session.nextRecommendedTask) {
    return { task: session.nextRecommendedTask, reason: 'Highest-priority outstanding task in the queue.' }
  }
  if (session.previousRecommendations) {
    return { task: null, reason: `Follow the last Claude recommendation: ${session.previousRecommendations}` }
  }
  return { task: null, reason: 'No outstanding tasks or recommendations — the queue is clear.' }
}

function deriveRecommendedNextBatch(session: DevelopmentSession): BatchRecommendation {
  if (session.suggestedNextBatch) {
    return { label: session.suggestedNextBatch, reason: 'Suggested in the latest Claude handover.' }
  }
  if (session.currentMilestone) {
    const batches = batchesForMilestone(session.currentMilestone.id)
    const completed = batches.filter(b => b.status === 'Complete').length
    const total = batches.length
    if (session.currentBatch) {
      return {
        label: `Continue Batch ${session.currentBatch.batchNumber}`,
        reason: `${completed}/${total} batches complete for "${session.currentMilestone.title}".`,
      }
    }
    return {
      label: `Start the next batch for "${session.currentMilestone.title}"`,
      reason: total > 0 ? `${completed}/${total} batches complete.` : 'No batches recorded yet for this milestone.',
    }
  }
  return { label: null, reason: 'No milestone set — define one before planning the next batch.' }
}

const TASK_PRIORITY_TIER: Record<TaskPriority, PriorityTier> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

function buildDevelopmentPriorities(session: DevelopmentSession, blockedTasks: Task[]): PriorityItem[] {
  const items: PriorityItem[] = []

  if (session.buildStatus === 'Failing') items.push({ label: 'Fix the failing build', tier: 'Critical', href: '/dev' })
  if (session.typescriptStatus === 'Failing') items.push({ label: 'Fix TypeScript errors', tier: 'Critical', href: '/dev' })

  for (const task of blockedTasks) {
    items.push({ label: `Unblock: ${task.title}`, tier: 'High', href: `/dev/queue?focus=${task.id}` })
  }
  for (const risk of session.activeRisks) {
    const tier: PriorityTier = risk.severity === 'High' ? 'Critical' : risk.severity === 'Medium' ? 'Medium' : 'Low'
    items.push({ label: risk.title, tier, href: `/dev/risks?focus=${risk.id}` })
  }
  for (const task of session.outstandingTasks) {
    items.push({ label: task.title, tier: TASK_PRIORITY_TIER[task.priority], href: `/dev/queue?focus=${task.id}` })
  }
  for (const debt of session.technicalDebt) {
    const tier: PriorityTier = debt.priority === 'High' ? 'High' : debt.priority === 'Medium' ? 'Medium' : 'Low'
    items.push({ label: debt.title, tier, href: `/dev/technical-debt?focus=${debt.id}` })
  }

  return items.sort((a, b) => PRIORITY_ORDER.indexOf(a.tier) - PRIORITY_ORDER.indexOf(b.tier))
}

function buildValidationChecklist(session: DevelopmentSession, blockedTasks: Task[]): ChecklistItem[] {
  return [
    {
      label: 'TypeScript passes',
      status: session.typescriptStatus === 'Passing' ? 'Passed' : session.typescriptStatus === 'Failing' ? 'Failed' : 'Pending',
    },
    {
      label: 'Build passes',
      status: session.buildStatus === 'Passing' ? 'Passed' : session.buildStatus === 'Failing' ? 'Failed' : 'Pending',
    },
    { label: 'No blocked tasks', status: blockedTasks.length === 0 ? 'Passed' : 'Attention' },
    { label: 'Risks reviewed', status: session.activeRisks.filter(r => r.status === 'Open').length === 0 ? 'Passed' : 'Attention' },
    { label: 'Documentation updated', status: 'Pending' },
  ]
}

function buildGitChecklist(session: DevelopmentSession): ChecklistItem[] {
  return [
    { label: 'Repository available', status: session.gitRepositoryStatus === 'Available' ? 'Passed' : 'Attention' },
    { label: 'Current branch identified', status: session.gitBranch !== 'Unavailable' ? 'Passed' : 'Pending' },
    {
      label: 'Working tree clean',
      status:
        session.gitWorkingTreeStatus === 'Clean' ? 'Passed' : session.gitWorkingTreeStatus === 'Modified' ? 'Attention' : 'Pending',
    },
  ]
}

/**
 * Only includes checks that can actually be verified — Build/TypeScript/
 * Git items are skipped entirely when the underlying signal is Unknown
 * (context wasn't passed in, or git itself is unavailable) rather than
 * showing a false status. Deployment configuration and URL availability
 * are always knowable (a plain true/false fact from the Deployment
 * Intelligence Engine), so those two are always included.
 */
function buildDeploymentChecklist(session: DevelopmentSession): ChecklistItem[] {
  const items: ChecklistItem[] = []
  if (session.buildStatus !== 'Unknown') {
    items.push({ label: 'Build passes', status: session.buildStatus === 'Passing' ? 'Passed' : 'Failed' })
  }
  if (session.typescriptStatus !== 'Unknown') {
    items.push({ label: 'TypeScript passes', status: session.typescriptStatus === 'Passing' ? 'Passed' : 'Failed' })
  }
  if (session.gitWorkingTreeStatus !== 'Unknown') {
    items.push({
      label: 'Git working tree clean',
      status: session.gitWorkingTreeStatus === 'Clean' ? 'Passed' : 'Attention',
    })
  }
  items.push({ label: 'Deployment configured', status: session.deploymentStatus === 'Available' ? 'Passed' : 'Attention' })
  items.push({
    label: 'Production URL available',
    status: session.deploymentUrl !== 'Not Configured' && session.deploymentUrl !== 'Unavailable' ? 'Passed' : 'Attention',
  })
  return items
}

/**
 * Only includes checks that can actually be verified — Build/TypeScript/
 * Repository items are skipped when the underlying signal is Unknown.
 * Deployment configuration and validation-recorded are always knowable
 * true/false facts, so those two are always included.
 */
function buildBuildChecklist(session: DevelopmentSession): ChecklistItem[] {
  const items: ChecklistItem[] = []
  if (session.buildStatus !== 'Unknown') {
    items.push({ label: 'Build passes', status: session.buildStatus === 'Passing' ? 'Passed' : 'Failed' })
  }
  if (session.typescriptStatus !== 'Unknown') {
    items.push({ label: 'TypeScript passes', status: session.typescriptStatus === 'Passing' ? 'Passed' : 'Failed' })
  }
  if (session.gitWorkingTreeStatus !== 'Unknown') {
    items.push({ label: 'Repository clean', status: session.gitWorkingTreeStatus === 'Clean' ? 'Passed' : 'Attention' })
  }
  items.push({ label: 'Deployment configured', status: session.deploymentStatus === 'Available' ? 'Passed' : 'Attention' })
  items.push({ label: 'Validation completed', status: session.lastValidation !== 'Unavailable' ? 'Passed' : 'Pending' })
  return items
}

/**
 * The one-sentence Executive Decision — picks the single most relevant
 * next action from signals every engine has already computed, in
 * severity order. Composition only: no new facts are derived here, just
 * a priority-ordered selection over existing session/blockedTasks data
 * (the same blockedTasks list buildDevelopmentPriorities already uses).
 */
function deriveExecutiveDecision(session: DevelopmentSession, blockedTasks: Task[]): string {
  if (session.buildStatus === 'Failing' || session.typescriptStatus === 'Failing') {
    return 'Fix the failing build before continuing.'
  }
  if (blockedTasks.length > 0) {
    return 'Resolve blocked tasks before continuing.'
  }
  if (session.gitWorkingTreeStatus === 'Modified') {
    return 'Repository requires attention — review or commit outstanding changes.'
  }
  if (session.activeRisks.length > 0) {
    return 'Review active risks before continuing.'
  }
  if (session.deploymentStatus !== 'Available') {
    return 'Deployment configuration incomplete.'
  }
  if (session.developmentReadiness !== 'Ready') {
    return 'Resolve outstanding items before continuing.'
  }
  return 'Ready to continue development.'
}

function buildDefinitionOfDone(session: DevelopmentSession): string[] {
  const items: string[] = []
  if (session.currentBatch) {
    items.push(`Batch ${session.currentBatch.batchNumber} objective is fully implemented${session.currentBatch.objective ? `: ${session.currentBatch.objective}` : '.'}`)
  }
  if (session.currentMilestone) {
    items.push(`Work contributes measurable progress toward "${session.currentMilestone.title}".`)
  }
  if (session.previousRecommendations) {
    items.push(`Previous Claude recommendations addressed: ${session.previousRecommendations}`)
  }
  if (items.length === 0) {
    items.push('Work matches the current project objective.')
  }
  items.push('npx tsc --noEmit passes with no errors.')
  items.push('npm run build completes successfully.')
  return items
}

function buildSuggestedClaudePrompt(session: DevelopmentSession): string {
  const lines: string[] = []
  lines.push(`# Development Prompt — ${session.project?.name ?? 'Project'}`)
  lines.push('')
  lines.push('## Current Objective')
  lines.push(session.currentObjective ?? 'Not set — define a current batch objective before starting.')
  lines.push('')
  lines.push('## Previous Implementation Summary')
  lines.push(session.previousClaudeSummary ?? 'No prior handover on record.')
  lines.push('')
  lines.push('## Outstanding Work')
  if (session.outstandingTasks.length === 0) {
    lines.push('- No outstanding tasks.')
  } else {
    for (const task of session.outstandingTasks) lines.push(`- ${task.title} (${PRIORITY_LABEL[task.priority]})`)
  }
  lines.push('')
  lines.push('## Git Status')
  const gitLines: string[] = []
  if (session.gitBranch !== 'Unavailable') gitLines.push(`- Current Branch: ${session.gitBranch}`)
  if (session.gitWorkingTreeStatus !== 'Unknown') gitLines.push(`- Working Tree Status: ${session.gitWorkingTreeStatus}`)
  if (session.gitRepositoryStatus === 'Available') gitLines.push(`- Repository Status: ${session.gitRepositoryStatus}`)
  if (session.gitChangedFileCount !== null) gitLines.push(`- Changed Files: ${session.gitChangedFileCount}`)
  lines.push(...(gitLines.length > 0 ? gitLines : ['- Not available.']))
  lines.push('')
  lines.push('## Deployment Status')
  lines.push(`- Deployment Readiness: ${session.deploymentReadiness}`)
  if (session.deploymentEnvironment !== 'Not Configured' && session.deploymentEnvironment !== 'Unknown') {
    lines.push(`- Environment: ${session.deploymentEnvironment}`)
  }
  if (session.deploymentUrl !== 'Not Configured' && session.deploymentUrl !== 'Unavailable') {
    lines.push(`- Production URL: ${session.deploymentUrl}`)
  }
  lines.push(`- Local URL: ${session.localDevelopmentUrl}`)
  const deploymentBlockers: string[] = []
  if (session.buildStatus === 'Failing') deploymentBlockers.push('Build is failing.')
  if (session.typescriptStatus === 'Failing') deploymentBlockers.push('TypeScript is failing.')
  if (session.gitWorkingTreeStatus === 'Modified') deploymentBlockers.push('Working tree has uncommitted changes.')
  if (session.deploymentStatus !== 'Available') deploymentBlockers.push('Deployment is not configured for this project.')
  lines.push(...(deploymentBlockers.length > 0 ? deploymentBlockers.map(b => `- Blocker: ${b}`) : ['- No outstanding deployment blockers.']))
  lines.push('')
  lines.push('## Build Status')
  const buildLines: string[] = []
  if (session.buildStatus !== 'Unknown') buildLines.push(`- Build: ${session.buildStatus}`)
  if (session.typescriptStatus !== 'Unknown') buildLines.push(`- TypeScript: ${session.typescriptStatus}`)
  if (session.lastValidation !== 'Unavailable') buildLines.push(`- Validation: ${session.lastValidation}`)
  if (session.buildConfidence !== 'Unknown') buildLines.push(`- Confidence: ${session.buildConfidence}`)
  lines.push(...(buildLines.length > 0 ? buildLines : ['- Not available.']))
  lines.push('')
  lines.push('## Active Risks')
  if (session.activeRisks.length === 0) {
    lines.push('- No active risks.')
  } else {
    for (const risk of session.activeRisks) lines.push(`- ${risk.title} (${risk.severity} severity)`)
  }
  lines.push('')
  lines.push('## Technical Debt')
  if (session.technicalDebt.length === 0) {
    lines.push('- No outstanding technical debt.')
  } else {
    for (const debt of session.technicalDebt) lines.push(`- ${debt.title} (${debt.priority} priority)`)
  }
  lines.push('')
  lines.push('## Validation Requirements')
  lines.push('- cmd /c npx tsc --noEmit must pass with no errors.')
  lines.push('- cmd /c npm run build must complete successfully.')
  lines.push('')
  lines.push('## Expected Return Format')
  lines.push('- Files Created')
  lines.push('- Files Modified')
  lines.push('- Features Implemented')
  lines.push('- Build Status')
  lines.push('- TypeScript Status')
  return lines.join('\n')
}

/**
 * Translates a Development Session into a Development Plan. Pure,
 * deterministic, stateless, synchronous — no AI, no Claude calls, no
 * dynamic generation. Every field is template-assembled from data the
 * Project/Development/Handover intelligence engines already produced.
 */
export function getDevelopmentPlan(slug: string, context: ProjectIntelligenceContext = {}): DevelopmentPlan {
  const projectIntel = getProjectIntelligence(slug, context)
  const devIntel = getDevelopmentIntelligence(slug, projectIntel)
  const session = getDevelopmentSession(slug, context, projectIntel, devIntel)

  return {
    currentGoal: buildCurrentGoal(session),
    currentObjective: session.currentObjective,
    recommendedNextTask: deriveRecommendedNextTask(session),
    recommendedNextBatch: deriveRecommendedNextBatch(session),
    developmentPriorities: buildDevelopmentPriorities(session, devIntel.blockedTasks),
    blockingRisks: session.activeRisks,
    technicalDebt: session.technicalDebt,
    validationChecklist: buildValidationChecklist(session, devIntel.blockedTasks),
    gitChecklist: buildGitChecklist(session),
    deploymentChecklist: buildDeploymentChecklist(session),
    buildChecklist: buildBuildChecklist(session),
    definitionOfDone: buildDefinitionOfDone(session),
    suggestedClaudePrompt: buildSuggestedClaudePrompt(session),
    executiveDecision: deriveExecutiveDecision(session, devIntel.blockedTasks),
  }
}

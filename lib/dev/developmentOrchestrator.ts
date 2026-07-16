import type { Project } from './projectsData'
import type { Milestone } from './milestonesStorage'
import type { Batch } from './batchesStorage'
import type { Task } from './queueStorage'
import type { Risk } from './risksStorage'
import type { TechnicalDebt } from './technicalDebtStorage'
import { getProjectIntelligence, type ProjectIntelligence, type ProjectIntelligenceContext } from './projectIntelligence'
import { getDevelopmentIntelligence, type DevelopmentIntelligence } from './developmentIntelligence'
import type { GitIntelligence } from './gitIntelligence'
import type { DeploymentIntelligence, DeploymentEnvironment, DeploymentReadiness as DeploymentReadinessLevel } from './deploymentIntelligence'
import type { BuildIntelligence, BuildConfidence } from './buildIntelligence'

const UNAVAILABLE = 'Unavailable'
const UNKNOWN = 'Unknown'

export type DevelopmentReadiness = 'Ready' | 'Needs Review' | 'Blocked'
export type GitReadiness = 'Clean' | 'Modified' | 'Unknown'

/**
 * The one authoritative snapshot of "where a project stands right now" —
 * composed entirely from the Project Intelligence Engine, the Development
 * Intelligence Engine, and (through them) the Handover Intelligence store.
 * This is the brain that understands state; it does not act on it.
 */
export type DevelopmentSession = {
  project: Project | undefined
  currentPhase: string
  currentMilestone: Milestone | null
  currentBatch: Batch | null
  currentTask: Task | null
  currentObjective: string | null
  previousClaudeSummary: string | null
  previousRecommendations: string | null
  outstandingTasks: Task[]
  activeRisks: Risk[]
  technicalDebt: TechnicalDebt[]
  buildStatus: string
  typescriptStatus: string
  nextRecommendedTask: Task | null
  suggestedNextBatch: string | null
  developmentReadiness: DevelopmentReadiness
  gitRepositoryStatus: 'Available' | 'Unavailable'
  gitBranch: string
  gitWorkingTreeStatus: GitReadiness
  gitChangedFileCount: number | null
  deploymentStatus: 'Available' | 'Not Configured'
  deploymentEnvironment: DeploymentEnvironment
  deploymentReadiness: DeploymentReadinessLevel
  deploymentUrl: string
  localDevelopmentUrl: string
  buildConfidence: BuildConfidence
  lastValidation: string
}

function computeDevelopmentReadiness(input: {
  buildStatus: string
  typescriptStatus: string
  blockedTaskCount: number
  hasObjective: boolean
  hasBatch: boolean
  hasMilestone: boolean
  gitDirty: boolean
}): DevelopmentReadiness {
  if (input.buildStatus === 'Failing' || input.typescriptStatus === 'Failing') return 'Blocked'
  if (input.blockedTaskCount > 0) return 'Needs Review'
  if (!input.hasMilestone || !input.hasBatch || !input.hasObjective) return 'Needs Review'
  if (input.gitDirty) return 'Needs Review'
  return 'Ready'
}

/**
 * Derives one Development Session for a project. Pure, deterministic, and
 * synchronous — same inputs always produce the same session, and nothing
 * here reads the DOM, the filesystem, or the network. It only reads from
 * the three engines it composes and returns a plain object.
 *
 * This is the coordination point future Git/Build/Deployment/Claude
 * automation batches plug into: they call this to understand state before
 * deciding anything, they don't replace it.
 *
 * Pass already-computed `projectIntel`/`devIntel` when the caller has them
 * (the AI Planning Engine does), so this never recomputes either engine.
 */
export function getDevelopmentSession(
  slug: string,
  context: ProjectIntelligenceContext = {},
  projectIntel?: ProjectIntelligence,
  devIntel?: DevelopmentIntelligence
): DevelopmentSession {
  const resolvedProjectIntel = projectIntel ?? getProjectIntelligence(slug, context)
  const resolvedDevIntel = devIntel ?? getDevelopmentIntelligence(slug, resolvedProjectIntel)
  return buildSession(resolvedProjectIntel, resolvedDevIntel, context.git, context.deployment, context.build)
}

function buildSession(
  projectIntel: ProjectIntelligence,
  devIntel: DevelopmentIntelligence,
  git?: GitIntelligence,
  deployment?: DeploymentIntelligence,
  build?: BuildIntelligence
): DevelopmentSession {
  const currentObjective = devIntel.objective

  const gitWorkingTreeStatus: GitReadiness = git?.workingTreeStatus ?? 'Unknown'
  const gitRepositoryStatus: 'Available' | 'Unavailable' = git?.repositoryAvailable ? 'Available' : 'Unavailable'
  const gitBranch = git?.branch ?? UNAVAILABLE
  const gitChangedFileCount = git?.filesChanged ?? null

  const deploymentStatus: 'Available' | 'Not Configured' = deployment?.deploymentAvailable ? 'Available' : 'Not Configured'
  const deploymentEnvironment: DeploymentEnvironment = deployment?.environment ?? 'Not Configured'
  const deploymentReadiness: DeploymentReadinessLevel = deployment?.deploymentReadiness ?? 'Needs Review'
  const deploymentUrl = deployment?.productionUrl ?? 'Not Configured'
  const localDevelopmentUrl = deployment?.localUrl ?? UNAVAILABLE

  const buildConfidence: BuildConfidence = build?.buildConfidence ?? UNKNOWN
  const lastValidation = build?.buildTimestamp ?? UNAVAILABLE

  const developmentReadiness = computeDevelopmentReadiness({
    buildStatus: projectIntel.buildStatus,
    typescriptStatus: projectIntel.typescriptStatus,
    blockedTaskCount: devIntel.blockedTasks.length,
    hasObjective: Boolean(currentObjective),
    hasBatch: Boolean(projectIntel.currentBatch),
    hasMilestone: Boolean(projectIntel.currentMilestone),
    gitDirty: gitWorkingTreeStatus === 'Modified',
  })

  return {
    project: projectIntel.project,
    currentPhase: projectIntel.currentPhase,
    currentMilestone: projectIntel.currentMilestone,
    currentBatch: projectIntel.currentBatch,
    currentTask: projectIntel.currentTask,
    currentObjective,
    previousClaudeSummary: projectIntel.latestHandover?.executiveSummary.trim() || null,
    previousRecommendations: devIntel.developmentRecommendation,
    outstandingTasks: devIntel.upcomingTasks,
    activeRisks: devIntel.activeRisks,
    technicalDebt: devIntel.activeDebt,
    buildStatus: projectIntel.buildStatus,
    typescriptStatus: projectIntel.typescriptStatus,
    nextRecommendedTask: projectIntel.nextRecommendedTask,
    suggestedNextBatch: devIntel.recommendedNextTask,
    developmentReadiness,
    gitRepositoryStatus,
    gitBranch,
    gitWorkingTreeStatus,
    gitChangedFileCount,
    deploymentStatus,
    deploymentEnvironment,
    deploymentReadiness,
    deploymentUrl,
    localDevelopmentUrl,
    buildConfidence,
    lastValidation,
  }
}

import type { GitIntelligence } from '../gitIntelligence'
import type { BuildIntelligence } from '../buildIntelligence'
import { getProjectBySlug } from '../projectsData'
import { milestonesForProject } from '../milestonesStorage'
import { batchesForProject } from '../batchesStorage'
import { debtForProject } from '../technicalDebtStorage'
import { decisionsForProject } from '../decisionsStorage'
import { getHandovers } from '../handoverStorage'
import { getKnowledgeNote } from '../knowledgeData'
import { getProjectIntelligence } from '../projectIntelligence'
import { getEngineeringOrganizationState } from '../initializer/organizationInitializer'
import { computeClientEngineeringFindings, buildExecutiveEngineeringReport, type ExecutiveEngineeringReport } from '../intelligence/engineeringIntelligenceEngine'
import type { EngineeringFinding } from '../intelligence/types'
import type { DevelopmentJob } from '../runtime/runtimeTypes'
import type { DNAProfileFields } from '../initializer/initializerTypes'
import type { ExecutionAnalyticsSummary } from '../learning/executionAnalytics'
import { buildEngineeringAssessment, buildAssessmentSnapshot } from './assessmentEngine'
import type { AssessmentReport } from './assessmentTypes'
import type { RepositoryFacts } from './assessmentModels'

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  const body = await res.json()
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`)
  return body as T
}

const UNAVAILABLE_GIT: GitIntelligence = {
  repositoryAvailable: false,
  branch: 'Unavailable',
  commitHash: 'Unavailable',
  commitMessage: 'Unavailable',
  commitDate: 'Unavailable',
  filesChanged: null,
  filesAdded: null,
  filesDeleted: null,
  filesModified: null,
  aheadBehind: null,
  workingTreeStatus: 'Unknown',
}

const UNAVAILABLE_BUILD: BuildIntelligence = {
  buildAvailable: false,
  lastBuildStatus: 'Unknown',
  lastTypeScriptStatus: 'Unknown',
  buildTimestamp: 'Unavailable',
  buildEnvironment: 'Unknown',
  buildReadiness: 'Needs Review',
  buildConfidence: 'Unknown',
}

/**
 * The client-side orchestration every Assessment consumer needs —
 * EngineeringAssessmentPanel.tsx and the Planning Centre both call this
 * rather than duplicating the fetch/compose sequence. Reuses the exact
 * same engines Mission Control already calls (server findings from
 * /api/dev/intelligence/report, client findings from
 * computeClientEngineeringFindings, Engineering Health from
 * buildExecutiveEngineeringReport) plus the Assessment-specific
 * /api/dev/assessment route (repository facts, DNA, Learning summary,
 * history). `persist` controls whether this run is also recorded as a
 * historical snapshot — a project already recording one from its own
 * Assessment panel run shouldn't get a second, redundant snapshot just
 * because the Planning Centre also needed a report. Also returns the
 * intermediate ExecutiveEngineeringReport and runtime job history so a
 * caller that also needs the Engineering Director's strategy (the
 * Planning Centre) doesn't have to re-fetch findings/jobs a second time
 * to get it.
 */
export async function computeFullAssessment(
  projectSlug: string,
  git?: GitIntelligence,
  build?: BuildIntelligence,
  persist = false
): Promise<{
  assessment: AssessmentReport
  executiveReport: ExecutiveEngineeringReport
  jobs: DevelopmentJob[]
  facts: RepositoryFacts
  dnaProfile: DNAProfileFields | null
  learningSummary: ExecutionAnalyticsSummary
}> {
  const project = getProjectBySlug(projectSlug)
  const milestones = milestonesForProject(projectSlug)
  const batches = batchesForProject(projectSlug)
  const debt = debtForProject(projectSlug)
  const decisions = decisionsForProject(projectSlug)
  const handovers = getHandovers().filter(h => h.project === projectSlug)
  const hasSqlDocumentation = getKnowledgeNote('sql').content.trim() !== ''

  const [{ findings: serverFindings }, { jobs }, { facts, dnaProfile, learningSummary }] = await Promise.all([
    fetchJson<{ findings: EngineeringFinding[] }>(`/api/dev/intelligence/report?hasSqlDocumentation=${hasSqlDocumentation}`),
    fetchJson<{ jobs: DevelopmentJob[] }>(`/api/dev/runtime/jobs?project=${encodeURIComponent(projectSlug)}`),
    fetchJson<{ facts: RepositoryFacts; dnaProfile: DNAProfileFields | null; learningSummary: ExecutionAnalyticsSummary }>(
      `/api/dev/assessment?project=${encodeURIComponent(projectSlug)}`
    ),
  ])

  const clientFindings = computeClientEngineeringFindings({ project, milestones, batches, debt, decisions, jobs, handovers })
  const completedBatches = batches.filter(b => b.status === 'Complete' && !b.archived)
  const productCompletion = batches.length > 0 ? Math.round((completedBatches.length / batches.length) * 100) : 0
  const executiveReport = buildExecutiveEngineeringReport(serverFindings, clientFindings, productCompletion)

  const projectIntel = getProjectIntelligence(projectSlug, { buildStatus: build?.lastBuildStatus, typescriptStatus: build?.lastTypeScriptStatus })
  const orgState = getEngineeringOrganizationState(projectSlug)
  const architectureNote = getKnowledgeNote('architecture').content.trim() !== ''
  const codingStandardsNote = getKnowledgeNote('coding-standards').content.trim() !== ''

  const assessment = buildEngineeringAssessment({
    projectSlug,
    projectName: project?.name ?? projectSlug,
    project,
    findings: executiveReport.findings,
    engineeringScore: executiveReport.engineeringScore,
    git: git ?? UNAVAILABLE_GIT,
    build: build ?? UNAVAILABLE_BUILD,
    facts,
    dnaProfile,
    knowledgeNotes: { architecture: architectureNote, codingStandards: codingStandardsNote },
    engineeringProgress: {
      currentPhase: projectIntel.currentPhase,
      currentMilestoneTitle: projectIntel.currentMilestone?.title ?? null,
      currentBatchNumber: projectIntel.currentBatch?.batchNumber ?? null,
      engineeringReady: orgState.engineeringReady,
      completionPercent: projectIntel.progress,
    },
  })

  if (persist) {
    const snapshot = buildAssessmentSnapshot(assessment)
    await fetchJson('/api/dev/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot),
    })
  }

  return { assessment, executiveReport, jobs, facts, dnaProfile, learningSummary }
}

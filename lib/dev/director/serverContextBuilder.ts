import { getGitIntelligence } from '../gitIntelligence'
import { getBuildIntelligence } from '../buildIntelligence'
import { listJobsForProject } from '../runtime/runtimeStorage'
import { PROMPT_VALIDATION_REQUIREMENTS, PROMPT_EXPECTED_RETURN_FORMAT, type GeneratedPrompt, type PromptSection } from '../promptIntelligenceEngine'
import type { DevelopmentContext } from '../runtime/runtimeContextBuilder'
import type { DevelopmentJob } from '../runtime/runtimeTypes'
import type { Batch } from '../batchesStorage'
import type { Milestone } from '../milestonesStorage'
import type { ExecutionSnapshot } from './executionSnapshotTypes'

/**
 * The headless equivalent of runtimeContextBuilder.ts's buildDevelopmentContext
 * + developmentPlanningEngine.ts's buildAutonomousPrompt — same output shape
 * (DevelopmentContext / GeneratedPrompt), built from the ExecutionSnapshot
 * plus signals this server already reads directly from disk (git, build/
 * TypeScript status, runtime job history) instead of from a live
 * DevelopmentSession/Memory/Queue composed client-side. Deliberately
 * simplified versus the browser-attended path: no Multi-Agent Workforce
 * review, no Executive Action Queue prioritization, no Development
 * Dependency Engine — the current batch's own stated objective IS the
 * task. See "Remaining Limitations" for what this trades away.
 */

function summarizeJob(job: DevelopmentJob | null): string {
  if (!job) return ''
  const parts = [`Status: ${job.status}`]
  if (job.duration !== null) parts.push(`Duration: ${Math.round(job.duration / 1000)}s`)
  if (job.cost !== null) parts.push(`Cost: $${job.cost.toFixed(4)}`)
  if (job.error) parts.push(`Error: ${job.error}`)
  return parts.join(' · ')
}

export function buildServerDevelopmentContext(snapshot: ExecutionSnapshot, currentBatch: Batch, currentMilestone: Milestone | null): DevelopmentContext {
  const git = getGitIntelligence()
  const build = getBuildIntelligence()
  const runtimeHistory = listJobsForProject(snapshot.project)

  return {
    product: snapshot.projectName,
    project: snapshot.project,
    productVision: [snapshot.projectTagline, snapshot.projectDescription].filter(Boolean).join(' — '),
    productBible: snapshot.productBible,
    currentPhase: currentMilestone?.phase || 'Unknown',
    currentMilestone: currentMilestone?.title ?? null,
    currentBatch: `Batch ${currentBatch.batchNumber}`,
    currentObjective: currentBatch.objective || null,
    currentTask: null,
    previousRuntimeExecution: runtimeHistory[0] ?? null,
    previousHandover: null,
    previousHandovers: [],
    previousClaudeCompletion: 'Unknown',
    outstandingRecommendations: null,
    developmentQueue: [],
    technicalDebt: snapshot.technicalDebt.map(d => ({ title: d.title, priority: d.priority })),
    architectureDecisions: snapshot.decisions,
    runtimeHistory: runtimeHistory.slice(0, 5),
    repositoryStatus: git.repositoryAvailable ? 'Available' : 'Unavailable',
    gitStatus: git.workingTreeStatus,
    gitDiffSummary: null,
    developmentRules: snapshot.developmentRules,
    openRisks: snapshot.openRisks.map(r => ({ title: r.title, severity: r.severity })),
    buildStatus: build.lastBuildStatus,
    typescriptStatus: build.lastTypeScriptStatus,
    relevantKnowledge: null,
  }
}

export function buildServerAutonomousPrompt(context: DevelopmentContext, currentBatch: Batch): GeneratedPrompt {
  const sections: PromptSection[] = []

  sections.push({ heading: 'Product', content: context.product })
  sections.push({ heading: 'Project', content: context.project })
  if (context.productVision) sections.push({ heading: 'Product Vision', content: context.productVision })
  if (context.currentPhase && context.currentPhase !== 'Unknown') sections.push({ heading: 'Current Phase', content: context.currentPhase })
  if (context.currentMilestone) sections.push({ heading: 'Current Milestone', content: context.currentMilestone })
  sections.push({ heading: 'Current Batch', content: context.currentBatch ?? `Batch ${currentBatch.batchNumber}` })
  sections.push({
    heading: 'Objective',
    content: currentBatch.objective || `Continue implementing Batch ${currentBatch.batchNumber}.`,
  })

  if (context.architectureDecisions.length > 0) {
    sections.push({ heading: 'Architecture Decisions', content: context.architectureDecisions.map(d => `- ${d.decision} — ${d.reason}`).join('\n') })
  }
  if (context.technicalDebt.length > 0) {
    sections.push({ heading: 'Technical Debt', content: context.technicalDebt.map(d => `- ${d.title} (${d.priority})`).join('\n') })
  }
  if (context.openRisks.length > 0) {
    sections.push({ heading: 'Open Risks', content: context.openRisks.map(r => `- ${r.title} (${r.severity})`).join('\n') })
  }
  if (context.previousRuntimeExecution) {
    sections.push({ heading: 'Previous Runtime Execution', content: summarizeJob(context.previousRuntimeExecution) })
  }
  if (context.runtimeHistory.length > 0) {
    sections.push({
      heading: 'Runtime History',
      content: context.runtimeHistory.map(j => `- ${j.status} (${new Date(j.createdAt).toISOString().slice(0, 10)}): ${summarizeJob(j)}`).join('\n'),
    })
  }

  sections.push({ heading: 'Repository Status', content: context.repositoryStatus })
  sections.push({ heading: 'Git Status', content: context.gitStatus })
  if (context.developmentRules) sections.push({ heading: 'Existing Development Rules', content: context.developmentRules })
  if (context.buildStatus !== 'Unknown') sections.push({ heading: 'Build Status', content: context.buildStatus })
  if (context.typescriptStatus !== 'Unknown') sections.push({ heading: 'TypeScript Status', content: context.typescriptStatus })

  sections.push({ heading: 'Validation Requirements', content: PROMPT_VALIDATION_REQUIREMENTS.map(v => `- ${v}`).join('\n') })
  sections.push({ heading: 'Expected Claude Return Format', content: PROMPT_EXPECTED_RETURN_FORMAT.map(v => `- ${v}`).join('\n') })

  const fullText = sections.map(s => `## ${s.heading}\n${s.content}`).join('\n\n')
  return { project: context.project, sections, fullText }
}

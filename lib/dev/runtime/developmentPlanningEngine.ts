import type { DevelopmentSession } from '../developmentOrchestrator'
import type { DevelopmentDependencyStatus } from '../developmentDependencyEngine'
import type { ExecutiveActionQueue } from '../executiveActionEngine'
import type { ExecutiveEngineeringReport } from '../intelligence/engineeringIntelligenceEngine'
import type { ExecutiveEngineeringStrategy } from '../director/directorTypes'
import { PROMPT_EXPECTED_RETURN_FORMAT, PROMPT_VALIDATION_REQUIREMENTS, type GeneratedPrompt, type PromptSection } from '../promptIntelligenceEngine'
import type { DevelopmentContext } from './runtimeContextBuilder'

export type PlannedTaskPriority = 'Critical' | 'High' | 'Medium' | 'Low'

export type PlannedTask = {
  title: string
  description: string
  reason: string
  sourceEngine: string
  href: string
  evidence: string
  expectedOutcome: string
  estimatedEffort: string
  priority: PlannedTaskPriority
  confidence: 'High' | 'Medium' | 'Low'
}

/**
 * Highest-priority task, selected by falling through engines that have
 * already computed a prioritized conclusion — never a new derivation of
 * "what matters." Order (Phase 4 Batch 4): the Autonomous Engineering
 * Director's own reprioritization outranks everything — but only when it
 * actually escalated something (recommendedPriorityChanges), since the
 * Director's job is to override the raw ranking, not restate it. Below
 * that: Critical/High Engineering Intelligence findings (the Director's
 * source data, unmodified), the Executive Action Queue's top action, the
 * Dependency Engine's next-ready batch, a manually-configured current
 * batch/objective, then the next item in the Development Queue. Returns
 * null only when every one of those is genuinely empty — never invents a
 * task.
 */
export function selectNextTask(
  session: DevelopmentSession,
  dependencies: DevelopmentDependencyStatus,
  actionQueue: ExecutiveActionQueue,
  engineeringReport: ExecutiveEngineeringReport | null,
  strategy: ExecutiveEngineeringStrategy | null
): PlannedTask | null {
  const escalation = strategy?.recommendedPriorityChanges[0]
  if (escalation) {
    return {
      title: escalation.finding.title,
      description: escalation.finding.recommendation,
      reason: escalation.reason,
      sourceEngine: `Autonomous Engineering Director (${escalation.finding.module})`,
      href: escalation.finding.location ?? '/dev',
      evidence: escalation.finding.evidence,
      expectedOutcome: `Resolves a recurring pattern flagged by the Director (escalated from ${escalation.originalPriority} to ${escalation.recommendedPriority}).`,
      estimatedEffort: 'Medium',
      priority: escalation.recommendedPriority,
      confidence: 'High',
    }
  }

  const topEngineeringFinding = engineeringReport?.recommendedTask
  if (topEngineeringFinding && (topEngineeringFinding.finding.severity === 'Critical' || topEngineeringFinding.finding.severity === 'High')) {
    const t = topEngineeringFinding
    return {
      title: t.finding.title,
      description: t.finding.recommendation,
      reason: t.reason,
      sourceEngine: `Engineering Intelligence Engine (${t.finding.module})`,
      href: t.finding.location ?? '/dev',
      evidence: t.finding.evidence,
      expectedOutcome: t.estimatedImpact,
      estimatedEffort: t.estimatedEffort,
      priority: t.finding.severity,
      confidence: t.confidence,
    }
  }

  if (actionQueue.topAction) {
    const a = actionQueue.topAction
    return {
      title: a.title,
      description: a.recommendedAction,
      reason: a.reason,
      sourceEngine: 'Executive Action Engine',
      href: a.href,
      evidence: a.reason,
      expectedOutcome: a.estimatedImpact,
      estimatedEffort: 'Medium',
      priority: a.priority,
      confidence: 'High',
    }
  }

  if (dependencies.recommendedNextExecutableTask) {
    const t = dependencies.recommendedNextExecutableTask
    return {
      title: t.label,
      description: `Continue ${t.label}.`,
      reason: 'Next batch ready to execute in dependency order — nothing higher priority is outstanding.',
      sourceEngine: 'Development Dependency Intelligence',
      href: t.href,
      evidence: `${t.label} is the next ready batch with no blocking dependency.`,
      expectedOutcome: 'Advances the next queued batch toward completion.',
      estimatedEffort: 'Medium',
      priority: 'Medium',
      confidence: 'High',
    }
  }

  if (session.currentBatch && session.currentObjective) {
    return {
      title: `Batch ${session.currentBatch.batchNumber}`,
      description: session.currentObjective,
      reason: 'A current batch and objective are already configured for this project.',
      sourceEngine: 'Self Development Engine',
      href: `/dev/batches?focus=${session.currentBatch.id}`,
      evidence: `session.currentBatch = Batch ${session.currentBatch.batchNumber}; session.currentObjective is set.`,
      expectedOutcome: `Progresses Batch ${session.currentBatch.batchNumber} toward completion.`,
      estimatedEffort: 'Medium',
      priority: 'Medium',
      confidence: 'High',
    }
  }

  if (session.outstandingTasks[0]) {
    const t = session.outstandingTasks[0]
    return {
      title: t.title,
      description: t.title,
      reason: 'Next item in the Development Queue.',
      sourceEngine: 'Development Queue',
      href: `/dev/queue?focus=${t.id}`,
      evidence: `"${t.title}" is the highest-priority open task in the queue (priority: ${t.priority}).`,
      expectedOutcome: 'Clears the next queued task.',
      estimatedEffort: 'Small',
      priority: t.priority === 'high' ? 'High' : t.priority === 'medium' ? 'Medium' : 'Low',
      confidence: 'Medium',
    }
  }

  const next = actionQueue.actions[0]
  if (next) {
    return {
      title: next.title,
      description: next.recommendedAction,
      reason: next.reason,
      sourceEngine: 'Executive Action Engine',
      href: next.href,
      evidence: next.reason,
      expectedOutcome: next.estimatedImpact,
      estimatedEffort: 'Medium',
      priority: next.priority,
      confidence: 'Medium',
    }
  }

  return null
}

function summarizeJob(job: DevelopmentContext['previousRuntimeExecution']): string {
  if (!job) return ''
  const parts = [`Status: ${job.status}`]
  if (job.duration !== null) parts.push(`Duration: ${Math.round(job.duration / 1000)}s`)
  if (job.cost !== null) parts.push(`Cost: $${job.cost.toFixed(4)}`)
  if (job.error) parts.push(`Error: ${job.error}`)
  return parts.join(' · ')
}

/**
 * Builds the full autonomous execution prompt from the assembled
 * Development Context plus the selected task — every section maps
 * directly to one context field, omitted when that field is empty/null,
 * exactly like Prompt Intelligence's own "never invent, never guess"
 * rule. Reuses PROMPT_VALIDATION_REQUIREMENTS/PROMPT_EXPECTED_RETURN_FORMAT
 * from the existing Prompt Intelligence Engine rather than redefining
 * them; the section list itself is new because the scope is wider
 * (product vision, architecture decisions, runtime history, development
 * rules) than the manual "Claude Instruction" prompt covers, so this
 * intentionally doesn't call getGeneratedPrompt — a different prompt for a
 * different purpose, not a duplicate of the same one.
 */
export function buildAutonomousPrompt(context: DevelopmentContext, task: PlannedTask | null): GeneratedPrompt {
  const sections: PromptSection[] = []

  sections.push({ heading: 'Product', content: context.product })
  sections.push({ heading: 'Project', content: context.project })
  if (context.productVision) sections.push({ heading: 'Product Vision', content: context.productVision })

  const bible = context.productBible
  const bibleFields = [
    bible.vision && `Vision: ${bible.vision}`,
    bible.goals && `Goals: ${bible.goals}`,
    bible.targetMarket && `Target Market: ${bible.targetMarket}`,
    bible.coreFeatures && `Core Features:\n${bible.coreFeatures}`,
  ].filter(Boolean)
  if (bibleFields.length > 0) sections.push({ heading: 'Product Bible', content: bibleFields.join('\n') })
  if (bible.futureRoadmap) sections.push({ heading: 'Roadmap', content: bible.futureRoadmap })
  if (context.currentPhase && context.currentPhase !== 'Unknown') sections.push({ heading: 'Current Phase', content: context.currentPhase })
  if (context.currentMilestone) sections.push({ heading: 'Current Milestone', content: context.currentMilestone })
  if (context.currentBatch) sections.push({ heading: 'Current Batch', content: context.currentBatch })
  if (context.currentTask) sections.push({ heading: 'Current Task', content: context.currentTask })

  if (task) {
    sections.push({ heading: 'Selected Task', content: `${task.title}\n${task.description}` })
    sections.push({
      heading: 'Why This Task Was Selected',
      content: [
        `- Reason: ${task.reason} (Source: ${task.sourceEngine})`,
        `- Evidence: ${task.evidence}`,
        `- Expected Outcome: ${task.expectedOutcome}`,
        `- Estimated Effort: ${task.estimatedEffort}`,
        `- Priority: ${task.priority}`,
        `- Confidence: ${task.confidence}`,
      ].join('\n'),
    })
  } else if (context.currentObjective) {
    sections.push({ heading: 'Objective', content: context.currentObjective })
  }

  const knowledge = context.relevantKnowledge
  if (knowledge && knowledge.dnaEntries.length > 0) {
    sections.push({
      heading: 'Relevant Engineering DNA',
      content: knowledge.dnaEntries.map(d => `- [${d.category}] ${d.title}: ${d.description}`).join('\n'),
    })
  }
  if (knowledge && knowledge.similarExecutions.length > 0) {
    sections.push({
      heading: 'Previous Similar Executions',
      content: knowledge.similarExecutions.map(e => `- ${e.objective} (${e.outcome})`).join('\n'),
    })
  }
  if (knowledge && knowledge.memoryEntries.length > 0) {
    sections.push({
      heading: 'Relevant Engineering Memory',
      content: knowledge.memoryEntries.map(m => `- ${m.topic}: ${m.summary}`).join('\n'),
    })
  }
  if (knowledge && knowledge.patterns.length > 0) {
    sections.push({
      heading: 'Known Patterns',
      content: knowledge.patterns.map(p => `- ${p.category}: ${p.description} (seen ${p.frequency} time(s))`).join('\n'),
    })
  }

  if (context.previousRuntimeExecution) {
    sections.push({ heading: 'Previous Runtime Execution', content: summarizeJob(context.previousRuntimeExecution) })
  }
  if (context.previousHandovers.length > 0) {
    sections.push({
      heading: 'Previous Handovers',
      content: context.previousHandovers
        .map(h => `- ${h.date}: ${h.executiveSummary || 'No executive summary recorded.'}`)
        .join('\n'),
    })
  }
  if (context.previousClaudeCompletion !== 'Unknown') {
    sections.push({ heading: 'Previous Claude Completion', content: context.previousClaudeCompletion })
  }
  if (context.outstandingRecommendations) {
    sections.push({ heading: 'Outstanding Recommendations', content: context.outstandingRecommendations })
  }
  if (context.developmentQueue.length > 0) {
    sections.push({
      heading: 'Development Queue',
      content: context.developmentQueue.map(t => `- ${t.title} (${t.priority})`).join('\n'),
    })
  }
  if (context.technicalDebt.length > 0) {
    sections.push({
      heading: 'Technical Debt',
      content: context.technicalDebt.map(d => `- ${d.title} (${d.priority})`).join('\n'),
    })
  }
  if (context.architectureDecisions.length > 0) {
    sections.push({
      heading: 'Architecture Decisions',
      content: context.architectureDecisions.map(d => `- ${d.decision} — ${d.reason}`).join('\n'),
    })
  }
  if (context.runtimeHistory.length > 0) {
    sections.push({
      heading: 'Runtime History',
      content: context.runtimeHistory.map(j => `- ${j.status} (${new Date(j.createdAt).toISOString().slice(0, 10)}): ${summarizeJob(j)}`).join('\n'),
    })
  }

  sections.push({ heading: 'Repository Status', content: context.repositoryStatus })
  sections.push({ heading: 'Git Status', content: context.gitStatus })
  if (context.gitDiffSummary) sections.push({ heading: 'Git Diff Summary', content: context.gitDiffSummary })
  if (context.developmentRules) sections.push({ heading: 'Existing Development Rules', content: context.developmentRules })
  if (context.openRisks.length > 0) {
    sections.push({ heading: 'Open Risks', content: context.openRisks.map(r => `- ${r.title} (${r.severity})`).join('\n') })
  }
  if (context.buildStatus !== 'Unknown') sections.push({ heading: 'Build Status', content: context.buildStatus })
  if (context.typescriptStatus !== 'Unknown') sections.push({ heading: 'TypeScript Status', content: context.typescriptStatus })

  sections.push({ heading: 'Validation Requirements', content: PROMPT_VALIDATION_REQUIREMENTS.map(v => `- ${v}`).join('\n') })
  sections.push({ heading: 'Expected Claude Return Format', content: PROMPT_EXPECTED_RETURN_FORMAT.map(v => `- ${v}`).join('\n') })

  const fullText = sections.map(s => `## ${s.heading}\n${s.content}`).join('\n\n')
  return { project: context.project, sections, fullText }
}

export type AutonomousDevelopmentPlan = {
  task: PlannedTask | null
  prompt: GeneratedPrompt
}

/**
 * The Development Planning Engine's entry point: select the highest-
 * priority task (now consuming the Autonomous Engineering Director's
 * strategy first, then the Engineering Intelligence Engine's report),
 * then generate the complete execution prompt from the already-assembled
 * context. This is the function Mission Control calls to go from "click
 * one button" to "a fully-formed, self-explaining prompt ready for the
 * runtime" with no manual objective required.
 */
export function planNextDevelopmentTask(
  context: DevelopmentContext,
  session: DevelopmentSession,
  dependencies: DevelopmentDependencyStatus,
  actionQueue: ExecutiveActionQueue,
  engineeringReport: ExecutiveEngineeringReport | null,
  strategy: ExecutiveEngineeringStrategy | null
): AutonomousDevelopmentPlan {
  const task = selectNextTask(session, dependencies, actionQueue, engineeringReport, strategy)
  const prompt = buildAutonomousPrompt(context, task)
  return { task, prompt }
}

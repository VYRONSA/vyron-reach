import { splitReportItems, type ParsedClaudeReport } from '../developmentCompletionEngine'
import { createRisk } from '../risksStorage'
import { createTechnicalDebt } from '../technicalDebtStorage'
import { createDecision } from '../decisionsStorage'
import { createJournalEntry } from '../journalStorage'
import { updateBatch } from '../batchesStorage'
import type { Handover } from '../handoverStorage'
import type { DevelopmentJob } from './runtimeTypes'

export type KnowledgeUpdateSummary = {
  risksCreated: number
  technicalDebtCreated: number
  decisionsCreated: number
  journalEntryCreated: boolean
}

/**
 * Automatic Knowledge Update — the step the mission specifically calls
 * out as missing: Architecture Decisions, Technical Debt, and the Risk
 * Register never updated themselves after an execution, only Handover/
 * Batch/Milestone/Learning did. Runs only from the CEO's Approve action
 * (never on Reject), once per completed-and-approved job, and only ever
 * creates a record for a section the report actually contained — an empty
 * section creates nothing, matching every other engine's "never
 * fabricate" rule already established in this codebase. Returns a count
 * of what it actually created, for the Review Package's "Knowledge
 * Updates" section — never a guess, always what was actually written.
 */
export function applyKnowledgeUpdates(
  parsed: ParsedClaudeReport,
  job: DevelopmentJob,
  handover: Handover,
  slug: string,
  batchId: string
): KnowledgeUpdateSummary {
  let risksCreated = 0
  let technicalDebtCreated = 0
  let decisionsCreated = 0

  for (const title of splitReportItems(parsed.risksIdentified)) {
    risksCreated += 1
    createRisk({
      title,
      description: `Identified during automated execution of ${job.objective || 'a development job'}.`,
      project: slug,
      relatedMilestone: job.milestoneId,
      severity: 'Medium',
      probability: 'Medium',
      mitigation: '',
      owner: 'Unassigned',
      status: 'Open',
    })
  }

  for (const title of splitReportItems(parsed.technicalDebtIdentified)) {
    technicalDebtCreated += 1
    createTechnicalDebt({
      title,
      description: `Identified during automated execution of ${job.objective || 'a development job'}.`,
      project: slug,
      relatedBatch: batchId,
      priority: 'Medium',
      estimatedEffort: 'Unknown',
      createdDate: handover.date,
      resolvedDate: '',
      status: 'Open',
    })
  }

  for (const decision of splitReportItems(parsed.architectureDecisions)) {
    decisionsCreated += 1
    createDecision({
      decision,
      reason: 'Recorded automatically from an execution report.',
      alternatives: '',
      approvedDate: handover.date,
      status: 'Approved',
      relatedProject: slug,
      relatedBatch: batchId,
    })
  }

  createJournalEntry({
    date: handover.date,
    project: slug,
    summary: parsed.executiveSummary,
    wins: parsed.recommendations,
    problems: parsed.risksIdentified,
    ideas: '',
    nextActions: parsed.nextSuggestedBatch,
  })

  // Closes the reconciliation gap between Batch's own text fields and the
  // Handover that actually documents the work — these fields were
  // otherwise only ever hand-typed and would silently drift from reality.
  if (batchId) {
    updateBatch(batchId, {
      lessonsLearned: parsed.recommendations,
      completedTasks: parsed.executiveSummary,
      claudePrompt: job.prompt,
    })
  }

  return { risksCreated, technicalDebtCreated, decisionsCreated, journalEntryCreated: true }
}

/**
 * The same counts applyKnowledgeUpdates would produce, without writing
 * anything — used to show the CEO what Approve will create, at review
 * time, before they decide. Deterministic from the same parsed text, so
 * these numbers always match what actually gets written on Approve.
 */
export function previewKnowledgeUpdates(parsed: ParsedClaudeReport): KnowledgeUpdateSummary {
  return {
    risksCreated: splitReportItems(parsed.risksIdentified).length,
    technicalDebtCreated: splitReportItems(parsed.technicalDebtIdentified).length,
    decisionsCreated: splitReportItems(parsed.architectureDecisions).length,
    journalEntryCreated: true,
  }
}

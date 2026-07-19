import type { ParsedClaudeReport } from '../developmentCompletionEngine'
import { splitReportItems } from '../developmentCompletionEngine'
import type { WorkforceReport } from '../agents/agentWorkforce'
import type { ContinuousValidationResult } from '../operations/operationsTypes'
import { getBuildResultDisplay, type BuildResultDisplay } from '../buildIntelligence'
import type { KnowledgeUpdateSummary } from './knowledgeUpdateEngine'
import type { DevelopmentJob } from './runtimeTypes'
import type { ExecutionIdentity } from './executionIdentity'

export type CeoChecklistItem = {
  label: string
  passed: boolean
}

export type ReviewPackage = {
  engineeringSummary: string
  filesCreated: string[]
  filesModified: string[]
  architectureChanges: string[]
  /** Best-effort categorization of filesCreated/filesModified by path pattern (supabase/*, *.sql) — not a separate analysis, just a filtered view of the same file lists. */
  databaseChanges: string[]
  /** Best-effort categorization of filesCreated/filesModified by path pattern (auth/security/permission/rls/policy keywords) — same caveat as databaseChanges. */
  securityChanges: string[]
  buildResult: DevelopmentJob['buildStatus']
  /** PASS / PASS (Warnings) / FAILED — what the mission's Review Package must render for Build, warnings never counting as failure. */
  buildResultDisplay: BuildResultDisplay
  buildWarningCount: number
  typescriptResult: DevelopmentJob['typescriptStatus']
  validationResult: ContinuousValidationResult | null
  knowledgeUpdates: KnowledgeUpdateSummary
  ceoChecklist: CeoChecklistItem[]
  /** The formal Execution Identity this job ran under (executionIdentity.ts) — null only for jobs created before this concept existed. The CEO Review surface's authoritative "what exactly is this a review of" record. */
  executionIdentity: ExecutionIdentity | null
}

const DATABASE_PATTERN = /(^|\/)supabase\/|\.sql$/i
const SECURITY_PATTERN = /auth|security|permission|rls|policy|policies/i

function categorize(files: string[], pattern: RegExp): string[] {
  return files.filter(f => pattern.test(f))
}

/**
 * The Review Package — everything the mission asks VYRON DEV to generate
 * automatically after execution, assembled entirely from data this
 * pipeline already produced (the parsed report, the job record, the
 * Continuous Validation result, the Workforce's review, and what the
 * Knowledge Update Engine actually wrote) — no new analysis, no AI call,
 * just structuring what's already known so a CEO reviews one coherent
 * package instead of raw report text.
 */
export function buildReviewPackage(
  parsed: ParsedClaudeReport,
  job: DevelopmentJob,
  validation: ContinuousValidationResult | null,
  workforce: WorkforceReport | null,
  knowledgeUpdates: KnowledgeUpdateSummary
): ReviewPackage {
  const allChangedFiles = [...parsed.filesCreated, ...parsed.filesModified]
  const buildResult = validation?.buildStatus ?? job.buildStatus
  const buildWarningCount = validation?.buildWarningCount ?? 0

  const checklist: CeoChecklistItem[] = [
    { label: 'Build passing', passed: buildResult === 'Passing' },
    { label: 'TypeScript passing', passed: (validation?.typescriptStatus ?? job.typescriptStatus) === 'Passing' },
    { label: 'No risks identified in this execution', passed: splitReportItems(parsed.risksIdentified).length === 0 },
    { label: 'Git diff captured', passed: Boolean(job.gitDiffSummary) },
  ]
  if (workforce) {
    checklist.push({ label: 'Workforce review had no unresolved conflicts', passed: workforce.conflicts.length === 0 })
  }

  return {
    engineeringSummary: parsed.executiveSummary,
    filesCreated: parsed.filesCreated,
    filesModified: parsed.filesModified,
    architectureChanges: splitReportItems(parsed.architectureDecisions),
    databaseChanges: categorize(allChangedFiles, DATABASE_PATTERN),
    securityChanges: categorize(allChangedFiles, SECURITY_PATTERN),
    buildResult,
    buildResultDisplay: getBuildResultDisplay(buildResult, buildWarningCount),
    buildWarningCount,
    typescriptResult: validation?.typescriptStatus ?? job.typescriptStatus,
    validationResult: validation,
    knowledgeUpdates,
    ceoChecklist: checklist,
    executionIdentity: job.executionIdentity,
  }
}

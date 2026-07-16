import { createHandover, type Handover, type ValidationStatus } from './handoverStorage'
import { batchesForMilestone, completeBatch, updateBatch } from './batchesStorage'
import { updateMilestone } from './milestonesStorage'
import { getProjectIntelligence, type ProjectIntelligenceContext } from './projectIntelligence'
import { getDevelopmentIntelligence } from './developmentIntelligence'
import { getDevelopmentSession } from './developmentOrchestrator'
import { developmentDependencyStatusForProject } from './developmentDependencyEngine'
import { developmentEventsForProject } from './developmentEventEngine'
import { getGeneratedPrompt, type GeneratedPrompt } from './promptIntelligenceEngine'

export type ParsedClaudeReport = {
  executiveSummary: string
  filesCreated: string[]
  filesModified: string[]
  filesDeleted: string[]
  buildStatus: ValidationStatus
  typescriptStatus: ValidationStatus
  runtimeStatus: ValidationStatus
  risksIdentified: string
  recommendations: string
  nextSuggestedBatch: string
}

type FieldKey = keyof ParsedClaudeReport

/**
 * Header aliases matching the section-heading convention this project's own
 * batch prompts have used throughout ("Files Created", "Build Status",
 * "Remaining Recommendations", ...) plus a few close variants. A line that
 * doesn't match any of these is just content of whatever section is
 * currently open — nothing is inferred beyond literal text matching.
 */
const SECTION_ALIASES: Record<FieldKey, string[]> = {
  executiveSummary: ['executive summary', 'summary', 'features implemented'],
  filesCreated: ['files created'],
  filesModified: ['files modified'],
  filesDeleted: ['files deleted'],
  buildStatus: ['build status'],
  typescriptStatus: ['typescript status'],
  runtimeStatus: ['runtime status'],
  risksIdentified: ['risks identified', 'risks'],
  recommendations: ['remaining recommendations', 'recommendations'],
  nextSuggestedBatch: ['suggested next batch', 'next suggested batch', 'recommended next batch'],
}

function cleanHeaderLine(line: string): string {
  return line
    .trim()
    .replace(/^#+\s*/, '')
    .replace(/^\*\*(.*)\*\*$/, '$1')
    .replace(/[:*_]+$/, '')
    .trim()
    .toLowerCase()
}

function findFieldForLabel(label: string): FieldKey | null {
  const cleaned = label.trim().toLowerCase()
  for (const key of Object.keys(SECTION_ALIASES) as FieldKey[]) {
    if (SECTION_ALIASES[key].includes(cleaned)) return key
  }
  return null
}

/** A line that is only a section heading — "Files Created", "## Build Status", "**Remaining Recommendations**". */
function matchHeaderLine(line: string): FieldKey | null {
  const cleaned = cleanHeaderLine(line)
  if (!cleaned || cleaned.length > 60) return null
  return findFieldForLabel(cleaned)
}

/** A single-line "Label: value" pair — "**Build Status**: PASS" — the convention this project's own batch summaries actually use for status fields. */
function matchInlineValue(line: string): { key: FieldKey; value: string } | null {
  const match = line.trim().match(/^#{0,3}\s*\*{0,2}([A-Za-z][A-Za-z /]*?)\*{0,2}\s*:\s*(.*)$/)
  if (!match) return null
  const key = findFieldForLabel(match[1])
  if (!key) return null
  return { key, value: match[2].trim() }
}

function isEmptyValue(text: string): boolean {
  const t = text.trim().toLowerCase()
  return t === '' || t === 'none' || t === 'n/a' || t === '-' || t === '—'
}

function parseListLines(lines: string[]): string[] {
  const items: string[] = []
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || isEmptyValue(line)) continue
    const bulletMatch = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/)
    const body = bulletMatch ? bulletMatch[1] : line
    const parts = bulletMatch ? [body] : body.split(',')
    for (const part of parts) {
      const cleaned = part.replace(/`/g, '').trim()
      if (cleaned && !isEmptyValue(cleaned)) items.push(cleaned)
    }
  }
  return items
}

function parseStatusValue(lines: string[]): ValidationStatus {
  const text = lines.join(' ').toLowerCase()
  if (/\bfail(ing|ed)?\b/.test(text)) return 'Failing'
  if (/\bpass(ing|ed)?\b/.test(text)) return 'Passing'
  return 'Unknown'
}

function parseTextValue(lines: string[]): string {
  const joined = lines
    .map(l => l.trim())
    .filter(Boolean)
    .join('\n')
    .trim()
  return isEmptyValue(joined) ? '' : joined
}

/**
 * Deterministic, rule-based extraction from a raw Claude implementation
 * report — no AI, no model call, no network. Recognizes both conventions
 * this project's own batch prompts actually produce: a section heading
 * followed by list/paragraph content ("Files Created\n- lib/x.ts"), and a
 * single-line "Label: value" pair ("**Build Status**: PASS"). A field whose
 * section never appears in the text is left empty/Unknown — never guessed
 * from surrounding content.
 */
export function parseClaudeReport(rawText: string): ParsedClaudeReport {
  const lines = rawText.replace(/\r\n/g, '\n').split('\n')
  const sections: Partial<Record<FieldKey, string[]>> = {}
  let current: FieldKey | null = null

  for (const line of lines) {
    const inline = matchInlineValue(line)
    if (inline) {
      current = inline.key
      if (!sections[current]) sections[current] = []
      if (inline.value) sections[current]!.push(inline.value)
      continue
    }
    const header = matchHeaderLine(line)
    if (header) {
      current = header
      if (!sections[current]) sections[current] = []
      continue
    }
    if (current) sections[current]!.push(line)
  }

  return {
    executiveSummary: parseTextValue(sections.executiveSummary ?? []),
    filesCreated: parseListLines(sections.filesCreated ?? []),
    filesModified: parseListLines(sections.filesModified ?? []),
    filesDeleted: parseListLines(sections.filesDeleted ?? []),
    buildStatus: parseStatusValue(sections.buildStatus ?? []),
    typescriptStatus: parseStatusValue(sections.typescriptStatus ?? []),
    runtimeStatus: parseStatusValue(sections.runtimeStatus ?? []),
    risksIdentified: parseTextValue(sections.risksIdentified ?? []),
    recommendations: parseTextValue(sections.recommendations ?? []),
    nextSuggestedBatch: parseTextValue(sections.nextSuggestedBatch ?? []),
  }
}

export type DevelopmentCompletionStatus = 'Development Complete' | 'Further Work Required'

export type CompletionInput = {
  claudeModel: string
  originalPrompt: string
}

export type DevelopmentCompletionResult = {
  parsed: ParsedClaudeReport
  handover: Handover
  status: DevelopmentCompletionStatus
  reasons: string[]
  nextPrompt: GeneratedPrompt | null
}

/**
 * Failing build/TypeScript/runtime, or an explicit next-batch suggestion in
 * the report, are the only signals treated as "further work required" —
 * the same build/typescript-first severity ordering already used by
 * computeDevelopmentReadiness and deriveExecutiveDecision. Risks or
 * recommendations being present doesn't by itself reopen a batch that
 * otherwise validated clean.
 */
function determineCompletionStatus(parsed: ParsedClaudeReport): { status: DevelopmentCompletionStatus; reasons: string[] } {
  const reasons: string[] = []
  if (parsed.buildStatus === 'Failing') reasons.push('Build is failing.')
  if (parsed.typescriptStatus === 'Failing') reasons.push('TypeScript is failing.')
  if (parsed.runtimeStatus === 'Failing') reasons.push('Runtime status reported as failing.')
  if (parsed.nextSuggestedBatch !== '') reasons.push(`A next batch was suggested: ${parsed.nextSuggestedBatch}`)
  return { status: reasons.length > 0 ? 'Further Work Required' : 'Development Complete', reasons }
}

/**
 * Milestone Progress has no existing canonical source — mirrors the same
 * "complete / total" formula getMilestoneProgress already uses for Project
 * Progress from milestone completion, one level down at the batch level.
 * Milestone status is deliberately left untouched: whether a milestone is
 * "done" stays a deliberate call made through the Admin UI, not something a
 * parsing engine flips on its own.
 */
function recomputeMilestoneProgress(milestoneId: string) {
  const batches = batchesForMilestone(milestoneId)
  if (batches.length === 0) return
  const complete = batches.filter(b => b.status === 'Complete').length
  updateMilestone(milestoneId, { progress: Math.round((complete / batches.length) * 100) })
}

/**
 * The Development Completion Engine — closes the loop after a Claude
 * implementation report comes back. Parses the report (pure, above), then
 * performs the writes needed to reflect it, delegating every actual
 * persistence step to the store functions that already own it
 * (createHandover, completeBatch/updateBatch, updateMilestone) rather than
 * reimplementing storage. Everything else the batch spec asks to see
 * "automatically update" — Development Events, Project Progress, the
 * Executive Command Centre, Latest Activity — already recomputes itself
 * from this same underlying data on its next read, by design of every
 * engine built so far, so there is nothing further to write for those.
 *
 * If the report indicates further work is required, the next Claude
 * implementation prompt is regenerated via the Prompt Intelligence Engine
 * against the post-write state, so the loop can continue immediately.
 */
export function completeDevelopmentCycle(
  slug: string,
  rawReport: string,
  input: CompletionInput,
  context: ProjectIntelligenceContext = {}
): DevelopmentCompletionResult {
  const parsed = parseClaudeReport(rawReport)

  const projectIntelBefore = getProjectIntelligence(slug, context)
  const devIntelBefore = getDevelopmentIntelligence(slug, projectIntelBefore)
  const sessionBefore = getDevelopmentSession(slug, context, projectIntelBefore, devIntelBefore)

  const relatedBatch = sessionBefore.currentBatch?.id ?? ''
  const relatedMilestone = sessionBefore.currentMilestone?.id ?? ''

  const handover = createHandover({
    project: slug,
    phase: sessionBefore.currentPhase,
    relatedMilestone,
    relatedBatch,
    date: new Date().toISOString().slice(0, 10),
    claudeModel: input.claudeModel,
    objective: sessionBefore.currentObjective ?? '',
    originalPrompt: input.originalPrompt,
    fullResponse: rawReport,
    executiveSummary: parsed.executiveSummary,
    filesCreated: parsed.filesCreated,
    filesModified: parsed.filesModified,
    filesDeleted: parsed.filesDeleted,
    sqlScriptsAdded: [],
    buildStatus: parsed.buildStatus,
    typescriptStatus: parsed.typescriptStatus,
    runtimeStatus: parsed.runtimeStatus,
    risksIdentified: parsed.risksIdentified,
    recommendations: parsed.recommendations,
    nextSuggestedBatch: parsed.nextSuggestedBatch,
  })

  const { status, reasons } = determineCompletionStatus(parsed)

  if (relatedBatch) {
    if (status === 'Development Complete') {
      completeBatch(relatedBatch)
    } else if (sessionBefore.currentBatch?.status === 'Queued') {
      updateBatch(relatedBatch, { status: 'Active' })
    }
  }
  if (relatedMilestone) recomputeMilestoneProgress(relatedMilestone)

  let nextPrompt: GeneratedPrompt | null = null
  if (status === 'Further Work Required') {
    const projectIntelAfter = getProjectIntelligence(slug, context)
    const devIntelAfter = getDevelopmentIntelligence(slug, projectIntelAfter)
    const sessionAfter = getDevelopmentSession(slug, context, projectIntelAfter, devIntelAfter)
    const dependenciesAfter = developmentDependencyStatusForProject(slug, context)
    const eventsAfter = developmentEventsForProject(slug, { git: context.git, build: context.build, deployment: context.deployment })
    nextPrompt = getGeneratedPrompt(slug, sessionAfter, dependenciesAfter, eventsAfter)
  }

  return { parsed, handover, status, reasons, nextPrompt }
}

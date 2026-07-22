import * as planningStateService from '../../planningState/planningStateService'
import * as knowledgeService from '../../knowledge/knowledgeService'
import { tokenize, scoreItem, topN } from '../../knowledge/organisationalKnowledgeScoring'
import { readExecutionRecords, readDNAProfile, readMemoryEntries } from '../../learning/learningStorage'
import { queryRelevantKnowledge } from '../../learning/knowledgeEngine'
import { listInboxItems } from '../engineeringInboxStore'
import type { KnowledgeItem, KnowledgeSourceType } from '../../knowledge/organisationalKnowledgeTypes'
import type { EngineeringIntelligenceQuery } from './engineeringIntelligenceTypes'

/**
 * The modular retriever registry for the Director's Engineering
 * Intelligence pipeline — one function per KnowledgeSourceType, each
 * either real (backed by an existing store) or an honest gap. Mirrors
 * lib/dev/initiation/knowledgeDiscovery.ts's exact shape: adding a new
 * source means writing one more retriever and appending it to
 * RETRIEVERS — nothing in serverContextBuilder.ts, serverExecutionLoop.ts,
 * or engineeringIntelligenceService.ts needs to change (requirement 4).
 *
 * Four categories (Architecture Decision Record, Technical Debt, Risk
 * Register, Development Rules) are deliberately NOT re-queried here —
 * they're built from the ExecutionSnapshot fields
 * lib/dev/director/liveKnowledgeRefresh.ts already refreshed at this
 * run's last synchronization boundary, so this pipeline never asks the
 * same question buildServerAutonomousPrompt's existing sections already
 * answer (see engineeringIntelligenceService.ts's rendering step, which
 * skips re-emitting those four as new prompt text while still counting
 * them for attribution).
 *
 * Three categories (Coding Standards, Platform Architecture, Component
 * Documentation) are honest gaps, not fabricated content — see each
 * retriever's own comment for why.
 */

type RetrieverOutcome = { sourceType: KnowledgeSourceType; items: KnowledgeItem[]; unavailableReason?: string }
type Retriever = (ctx: EngineeringIntelligenceQuery, queryTokens: string[]) => RetrieverOutcome

// ---- Reused from the ExecutionSnapshot (already frozen at this run's last boundary) ----

const retrieveArchitectureDecisions: Retriever = ctx => {
  const items: KnowledgeItem[] = ctx.snapshotDecisions.map((d, i) => ({
    sourceType: 'Architecture Decision Record',
    sourceRef: `snapshot:${ctx.project}/decision:${i}`,
    project: ctx.project,
    title: d.decision,
    summary: d.reason,
    timestamp: null,
    relevanceScore: 1,
  }))
  return { sourceType: 'Architecture Decision Record', items: topN(items) }
}

const retrieveTechnicalDebt: Retriever = ctx => {
  const items: KnowledgeItem[] = ctx.snapshotTechnicalDebt.map((d, i) => ({
    sourceType: 'Technical Debt',
    sourceRef: `snapshot:${ctx.project}/debt:${i}`,
    project: ctx.project,
    title: d.title,
    summary: `Priority: ${d.priority}`,
    timestamp: null,
    relevanceScore: 1,
  }))
  return { sourceType: 'Technical Debt', items: topN(items) }
}

const retrieveRiskRegister: Retriever = ctx => {
  const items: KnowledgeItem[] = ctx.snapshotOpenRisks.map((r, i) => ({
    sourceType: 'Risk Register',
    sourceRef: `snapshot:${ctx.project}/risk:${i}`,
    project: ctx.project,
    title: r.title,
    summary: `Severity: ${r.severity}`,
    timestamp: null,
    relevanceScore: 1,
  }))
  return { sourceType: 'Risk Register', items: topN(items) }
}

const retrieveDevelopmentRules: Retriever = ctx => {
  if (!ctx.snapshotDevelopmentRules.trim()) {
    return { sourceType: 'Development Rules', items: [], unavailableReason: 'No Development Rules have been configured yet.' }
  }
  return {
    sourceType: 'Development Rules',
    items: [{
      sourceType: 'Development Rules',
      sourceRef: `snapshot:${ctx.project}/development-rules`,
      project: null,
      title: 'VYRON DEV Development Rules',
      summary: ctx.snapshotDevelopmentRules,
      timestamp: null,
      relevanceScore: 1,
    }],
  }
}

// ---- Foundational, always included when present ----

const STATIC_ENGINEERING_STANDARDS = `VYRON DEV builds on Next.js App Router with TypeScript. Server-owned state lives in small file-JSON stores behind a service layer (one service = the only writer for its domain, enforces invariants, publishes events). REST API routes under app/api are thin wrappers that call the service layer. UI is React Server/Client Components, built from shared primitives, styled with Tailwind. "Engineering work" means a new or modified TypeScript module, API route, UI component, automated script, test, or a written artifact committed into a durable store — never a verbal or organizational activity.`

const retrieveEngineeringStandards: Retriever = () => ({
  sourceType: 'Engineering Standards',
  items: [{
    sourceType: 'Engineering Standards',
    sourceRef: 'static:vyron-dev-conventions',
    project: null,
    title: 'VYRON DEV engineering conventions',
    summary: STATIC_ENGINEERING_STANDARDS,
    timestamp: null,
    relevanceScore: 1,
  }],
})

// ---- Real, freshly retrieved ----

const retrieveProductKnowledge: Retriever = (ctx, tokens) => {
  const handovers = knowledgeService.listHandovers(ctx.project)
  const items: KnowledgeItem[] = handovers.map(h => ({
    sourceType: 'Product Knowledge',
    sourceRef: `knowledge:${ctx.project}/handover:${h.id}`,
    project: ctx.project,
    title: `${h.phase}: ${h.objective.slice(0, 80)}`,
    summary: h.executiveSummary,
    timestamp: h.timestamp,
    relevanceScore: scoreItem(`${h.objective} ${h.executiveSummary}`, tokens, ctx.project, ctx.project),
  }))
  return { sourceType: 'Product Knowledge', items: topN(items) }
}

const retrieveProductDecisions: Retriever = (ctx, tokens) => {
  const items: KnowledgeItem[] = []
  for (const d of planningStateService.listDecisions(ctx.project)) {
    items.push({
      sourceType: 'Product Decision Register',
      sourceRef: `planning:${ctx.project}/decision:${d.id}`,
      project: ctx.project,
      title: d.decision,
      summary: d.reason,
      timestamp: d.updatedAt,
      relevanceScore: scoreItem(`${d.decision} ${d.reason} ${d.alternatives}`, tokens, ctx.project, ctx.project),
    })
  }
  for (const d of knowledgeService.listBusinessDecisions(ctx.project)) {
    items.push({
      sourceType: 'Product Decision Register',
      sourceRef: `knowledge:${ctx.project}/business-decision:${d.id}`,
      project: ctx.project,
      title: d.decision,
      summary: d.reason,
      timestamp: d.timestamp,
      relevanceScore: scoreItem(`${d.decision} ${d.reason} ${d.alternatives}`, tokens, ctx.project, ctx.project),
    })
  }
  return { sourceType: 'Product Decision Register', items: topN(items) }
}

/** Cross-project — completed batches from every project, weighted toward this one (scoreItem's same-project bonus), so a genuinely relevant prior batch elsewhere in the platform can still surface. */
const retrievePreviousEngineeringBatches: Retriever = (ctx, tokens) => {
  const items: KnowledgeItem[] = []
  for (const project of planningStateService.listProjects()) {
    for (const b of planningStateService.listBatches(project.slug)) {
      if (b.status !== 'Complete') continue
      if (b.id === ctx.currentBatchId) continue
      items.push({
        sourceType: 'Previous Engineering Batch',
        sourceRef: `planning:${project.slug}/batch:${b.id}`,
        project: project.slug,
        title: `${b.batchNumber} — ${b.objective.slice(0, 80)}`,
        summary: b.summary || b.objective,
        timestamp: b.updatedAt,
        relevanceScore: scoreItem(`${b.objective} ${b.summary}`, tokens, project.slug, ctx.project),
      })
    }
  }
  return { sourceType: 'Previous Engineering Batch', items: topN(items) }
}

const retrievePreviousEngineeringOutcomes: Retriever = (ctx, tokens) => {
  const completions = knowledgeService.listBatchCompletions(ctx.project)
  const items: KnowledgeItem[] = completions.map(c => ({
    sourceType: 'Previous Engineering Outcome',
    sourceRef: `knowledge:${ctx.project}/batch-completion:${c.id}`,
    project: ctx.project,
    title: `Batch ${c.batchNumber} outcome`,
    summary: `${c.objective} — ${c.summary}`,
    timestamp: c.timestamp,
    relevanceScore: scoreItem(`${c.objective} ${c.summary}`, tokens, ctx.project, ctx.project),
  }))
  return { sourceType: 'Previous Engineering Outcome', items: topN(items) }
}

/** Both Lessons Learned and Shared Framework Knowledge below independently compose the same three cheap, sync, in-memory stores and call the Learning Engine's queryRelevantKnowledge once each — the exact composition app/api/dev/learning/knowledge/route.ts already uses. This is what makes Learning (previously read only by the browser-attended path — see the platform audit) genuinely consulted by the headless loop for the first time. */
function queryLearning(ctx: EngineeringIntelligenceQuery) {
  const allRecords = readExecutionRecords()
  const dnaProfile = readDNAProfile(ctx.project)
  const memoryEntries = readMemoryEntries()
  return queryRelevantKnowledge(ctx.queryText, ctx.project, allRecords, dnaProfile, memoryEntries)
}

/** EngineeringMemoryEntry carries no `project` field (confirmed global, not per-project) — recorded as cross-cutting knowledge, same as Engineering Standards. */
const retrieveLessonsLearned: Retriever = (ctx, tokens) => {
  const knowledge = queryLearning(ctx)
  const items: KnowledgeItem[] = []
  for (const p of knowledge.patterns) {
    items.push({
      sourceType: 'Lessons Learned',
      sourceRef: `learning:pattern:${p.category}`,
      project: p.projectsAffected.includes(ctx.project) ? ctx.project : null,
      title: `${p.category} (seen ${p.frequency}×)`,
      summary: p.description,
      timestamp: null,
      relevanceScore: scoreItem(p.description, tokens, null, null) || 0.4,
    })
  }
  for (const m of knowledge.memoryEntries) {
    items.push({
      sourceType: 'Lessons Learned',
      sourceRef: `learning:memory:${m.id}`,
      project: null,
      title: m.topic,
      summary: m.summary,
      timestamp: m.createdAt,
      relevanceScore: scoreItem(`${m.topic} ${m.summary}`, tokens, null, null),
    })
  }
  return { sourceType: 'Lessons Learned', items: topN(items) }
}

/** Engineering DNA — cross-project by design (an EngineeringDNAProfile is keyed by product, and a fact worth keeping is one this codebase has already validated across executions), so every item here is recorded with `project: null`. */
const retrieveSharedFrameworkKnowledge: Retriever = (ctx, tokens) => {
  const knowledge = queryLearning(ctx)
  const items: KnowledgeItem[] = knowledge.dnaEntries.map(d => ({
    sourceType: 'Shared Framework Knowledge',
    sourceRef: `learning:dna:${d.id}`,
    project: null,
    title: d.title,
    summary: d.description,
    timestamp: d.createdAt,
    relevanceScore: scoreItem(`${d.title} ${d.description}`, tokens, null, null),
  }))
  return { sourceType: 'Shared Framework Knowledge', items: topN(items) }
}

/**
 * Specifically the Director's worker-review verdicts — Engineering
 * Inbox items whose reasonType is 'Worker Review Required' (created
 * exclusively by serverExecutionLoop.ts's pause() when
 * validateWorkerOutput rejects a batch, or a workforce conflict blocks
 * it). Filtered separately from Historical Fixes below so the two
 * sources answer different questions rather than duplicating the same
 * inbox records under two names.
 */
const retrieveReviewBoardDecisions: Retriever = (ctx, tokens) => {
  const items: KnowledgeItem[] = listInboxItems({ project: ctx.project })
    .filter(i => i.reasonType === 'Worker Review Required')
    .map(i => ({
      sourceType: 'Review Board Decision',
      sourceRef: `director:${ctx.project}/inbox:${i.id}`,
      project: ctx.project,
      title: `Worker review — Batch ${i.batchNumber ?? 'unknown'}`,
      summary: i.resolutionNote ? `${i.reason} Resolution: ${i.resolutionNote}` : i.reason,
      timestamp: i.timestamp,
      relevanceScore: scoreItem(i.reason, tokens, ctx.project, ctx.project),
    }))
  return { sourceType: 'Review Board Decision', items: topN(items) }
}

/**
 * Every OTHER kind of resolved intervention (Build Failure, Technical
 * Debt Escalation, Business Decision Required, Security Review,
 * Deployment Approval, Approval Required) — "how did we fix this class
 * of blocker before," using the real resolutionNote a CEO recorded when
 * resolving it. Excludes Worker Review Required (see
 * retrieveReviewBoardDecisions above) to avoid the same records
 * surfacing under two source names.
 */
const retrieveHistoricalFixes: Retriever = (ctx, tokens) => {
  const items: KnowledgeItem[] = listInboxItems({ project: ctx.project, status: 'Resolved' })
    .filter(i => i.reasonType !== 'Worker Review Required')
    .map(i => ({
      sourceType: 'Historical Fix',
      sourceRef: `director:${ctx.project}/inbox:${i.id}`,
      project: ctx.project,
      title: `${i.reasonType} — Batch ${i.batchNumber ?? 'unknown'}`,
      summary: `${i.reason} Fix: ${i.resolutionNote ?? 'No resolution note recorded.'}`,
      timestamp: i.resolvedAt ?? i.timestamp,
      relevanceScore: scoreItem(`${i.reason} ${i.resolutionNote ?? ''}`, tokens, ctx.project, ctx.project),
    }))
  return { sourceType: 'Historical Fix', items: topN(items) }
}

/** Autonomous Quality Assurance's permanent record (lib/dev/knowledge/knowledgeService.ts's recordVerification) — every prior verification run for this project, passed or failed, now retrievable the same way every other organisational-knowledge source here is. The summary always carries the real per-activity evidence (not just a pass/fail count) so this is genuinely useful organisational knowledge, not a terse status badge. */
const retrieveVerificationHistory: Retriever = (ctx, tokens) => {
  const items: KnowledgeItem[] = knowledgeService.listVerifications(ctx.project).map(v => {
    const notable = v.passed ? v.activities.filter(a => a.status === 'Passed') : v.activities.filter(a => a.status === 'Failed')
    const digest = notable.map(a => `${a.activity}: ${a.summary}`).join(' | ')
    const summary = v.passed ? `Passed — ${digest}` : `Failed — ${digest}`
    return {
      sourceType: 'Verification History',
      sourceRef: `knowledge:${ctx.project}/verification:${v.id}`,
      project: ctx.project,
      title: v.passed ? 'Verification passed' : 'Verification failed',
      summary,
      timestamp: v.timestamp,
      relevanceScore: scoreItem(summary, tokens, ctx.project, ctx.project),
    }
  })
  return { sourceType: 'Verification History', items: topN(items) }
}

/** Autonomous Release Management's permanent record (lib/dev/knowledge/knowledgeService.ts's recordRelease) — every prior release for this project, released or failed, retrievable the same way Verification History is. */
const retrieveReleaseHistory: Retriever = (ctx, tokens) => {
  const items: KnowledgeItem[] = knowledgeService.listReleases(ctx.project).map(r => {
    const notable = r.passed ? r.activities.filter(a => a.status === 'Passed') : r.activities.filter(a => a.status === 'Failed')
    const digest = notable.map(a => `${a.activity}: ${a.summary}`).join(' | ')
    const summary = r.passed ? `Released v${r.version} — ${digest}` : `Failed v${r.version} — ${digest}`
    return {
      sourceType: 'Release History',
      sourceRef: `knowledge:${ctx.project}/release:${r.id}`,
      project: ctx.project,
      title: r.passed ? `Released v${r.version}` : `Release v${r.version} failed`,
      summary,
      timestamp: r.timestamp,
      relevanceScore: scoreItem(summary, tokens, ctx.project, ctx.project),
    }
  })
  return { sourceType: 'Release History', items: topN(items) }
}

/** Autonomous Operations' permanent record (lib/dev/knowledge/knowledgeService.ts's recordIncident) — every resolved operational incident for this project, retrievable the same way Verification/Release History already are. */
const retrieveOperationalHistory: Retriever = (ctx, tokens) => {
  const items: KnowledgeItem[] = knowledgeService.listIncidents(ctx.project).map(i => {
    const summary = `${i.severity} severity — ${i.review}`
    return {
      sourceType: 'Operational History',
      sourceRef: `knowledge:${ctx.project}/incident:${i.id}`,
      project: ctx.project,
      title: `Incident resolved (${i.severity})`,
      summary,
      timestamp: i.timestamp,
      relevanceScore: scoreItem(summary, tokens, ctx.project, ctx.project),
    }
  })
  return { sourceType: 'Operational History', items: topN(items) }
}

// ---- Structurally unavailable today — honest gaps, never fabricated ----

const retrieveCodingStandards: Retriever = () => ({
  sourceType: 'Coding Standards',
  items: [],
  unavailableReason: 'The Knowledge Base wiki\'s "coding-standards" note (lib/dev/knowledgeData.ts) is browser-localStorage-only, with no server-side persistence — unreachable from this headless pipeline today (the same structural limitation Initiation\'s Knowledge Discovery already documents for the same underlying store).',
})

const retrievePlatformArchitecture: Retriever = () => ({
  sourceType: 'Platform Architecture',
  items: [],
  unavailableReason: 'No distinct Platform Architecture artifact store exists separate from Architecture Decision Records and Development Rules (both already retrieved above) — recording it as a third, separate source would double-count the same underlying facts rather than add real content.',
})

const retrieveComponentDocumentation: Retriever = () => ({
  sourceType: 'Component Documentation',
  items: [],
  unavailableReason: 'Real documentation-coverage findings exist (lib/dev/intelligence/documentationIntelligence.ts), but they depend on a full synchronous filesystem walk of the whole repository (repositoryScanner.ts\'s scanRepositoryFiles) with no caching — not acceptable to run unconditionally on every batch of a headless, frequently-iterating loop without a caching layer this pipeline does not build. Deferred rather than fabricated or forced in at real per-batch performance cost.',
})

export const RETRIEVERS: Retriever[] = [
  retrieveArchitectureDecisions,
  retrieveTechnicalDebt,
  retrieveRiskRegister,
  retrieveDevelopmentRules,
  retrieveEngineeringStandards,
  retrieveProductKnowledge,
  retrieveProductDecisions,
  retrievePreviousEngineeringBatches,
  retrievePreviousEngineeringOutcomes,
  retrieveLessonsLearned,
  retrieveSharedFrameworkKnowledge,
  retrieveReviewBoardDecisions,
  retrieveHistoricalFixes,
  retrieveVerificationHistory,
  retrieveReleaseHistory,
  retrieveOperationalHistory,
  retrieveCodingStandards,
  retrievePlatformArchitecture,
  retrieveComponentDocumentation,
]

export function tokenizeQuery(queryText: string): string[] {
  return Array.from(new Set(tokenize(queryText)))
}

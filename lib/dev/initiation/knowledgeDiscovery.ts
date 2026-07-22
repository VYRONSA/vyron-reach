import * as planningStateService from '../planningState/planningStateService'
import * as knowledgeService from '../knowledge/knowledgeService'
import { getDevelopmentRules } from '../knowledge/developmentRulesStore'
import { tokenize, scoreItem, topN, MAX_ITEMS_PER_SOURCE } from '../knowledge/organisationalKnowledgeScoring'
import { listInitiationRequests } from './initiationStore'
import type { KnowledgeGap, KnowledgeItem, KnowledgeSourceType } from './initiationTypes'

/**
 * Knowledge Discovery — runs automatically before every generation attempt
 * (see initiationGenerationService.ts's runGeneration) so the Executive
 * Directive is never the sole input to programme generation. Retrieval is
 * organized as a flat list of independent retriever functions, each
 * responsible for exactly one KnowledgeSourceType; adding a new source
 * later means writing one more retriever and appending it to RETRIEVERS —
 * nothing about the ranking, the result shape, or the generator's own
 * prompt-building code needs to change (requirement: "remain compatible
 * with future retrieval sources without changing the generator").
 *
 * Two sources — Existing Project Documentation and Prompt Library — are
 * structurally unreachable from here today: their only home
 * (lib/dev/knowledgeData.ts) is a localStorage-backed browser store with
 * no server-side persistence at all (the same constraint
 * lib/dev/scheduler/serverHandoffBuilder.ts already documents for Product
 * Bible). Rather than silently pretending those sources don't exist, or
 * fabricating content for them, their retrievers report an honest
 * `unavailableReason` — surfaced as a recorded knowledge gap, never a
 * fabricated result. That is a real limitation of the current server-side
 * architecture, not an oversight of this pipeline.
 */

export type KnowledgeDiscoveryContext = {
  /** The project slug this directive is being initiated against. */
  project: string
  directiveTitle: string
  directiveText: string
  /** Excludes the in-progress InitiationRequest itself from "previous directive/programme" retrieval — relevant on a Review -> regenerate cycle. */
  excludeInitiationId?: string
}

/** engineeringStandards is deliberately separate from organisationalKnowledge — Engineering Standards is its own top-level prompt section (requirement 6), not part of the ranked "what has this organisation learned" list. It is never ranked/capped: everything here is foundational and always included in full. */
export type KnowledgeDiscoveryResult = {
  organisationalKnowledge: KnowledgeItem[]
  engineeringStandards: KnowledgeItem[]
  gaps: KnowledgeGap[]
  retrievedAt: string
  sourcesConsulted: number
}

type RetrieverOutcome = { sourceType: KnowledgeSourceType; items: KnowledgeItem[]; unavailableReason?: string }
type Retriever = (ctx: KnowledgeDiscoveryContext, queryTokens: string[]) => RetrieverOutcome

// tokenize/scoreItem/topN/MAX_ITEMS_PER_SOURCE now live in
// lib/dev/knowledge/organisationalKnowledgeScoring.ts (imported above) —
// shared with the Director's Engineering Intelligence pipeline instead
// of being redefined here.

// ---- Retrievers: Planning Service (current-state, per-project + cross-project) ----

const retrieveProductDecisions: Retriever = (ctx, tokens) => {
  const items: KnowledgeItem[] = []
  for (const project of planningStateService.listProjects()) {
    const decisions = project.slug === ctx.project ? planningStateService.listDecisions(ctx.project) : planningStateService.listDecisions(project.slug)
    for (const d of decisions) {
      items.push({
        sourceType: 'Product Decision Register',
        sourceRef: `planning:${project.slug}/decision:${d.id}`,
        project: project.slug,
        title: d.decision,
        summary: d.reason,
        timestamp: d.updatedAt,
        relevanceScore: scoreItem(`${d.decision} ${d.reason} ${d.alternatives}`, tokens, project.slug, ctx.project),
      })
    }
  }
  // Business Decisions from the Knowledge Service belong to this same "what did we decide about the product" category.
  const business = knowledgeService.listBusinessDecisions(ctx.project)
  for (const d of business) {
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

const retrieveArchitectureDecisions: Retriever = (ctx, tokens) => {
  const records = knowledgeService.listArchitectureDecisions(ctx.project)
  const items: KnowledgeItem[] = records.map(d => ({
    sourceType: 'Architecture Decision Record',
    sourceRef: `knowledge:${ctx.project}/adr:${d.id}`,
    project: ctx.project,
    title: d.decision,
    summary: d.reason,
    timestamp: d.timestamp,
    relevanceScore: scoreItem(`${d.decision} ${d.reason} ${d.alternatives}`, tokens, ctx.project, ctx.project),
  }))
  return { sourceType: 'Architecture Decision Record', items: topN(items) }
}

const retrieveRiskRegister: Retriever = (ctx, tokens) => {
  const items: KnowledgeItem[] = []
  for (const project of planningStateService.listProjects()) {
    for (const r of planningStateService.listRisks(project.slug)) {
      items.push({
        sourceType: 'Risk Register',
        sourceRef: `planning:${project.slug}/risk:${r.id}`,
        project: project.slug,
        title: r.title,
        summary: `${r.description} (severity: ${r.severity}, mitigation: ${r.mitigation || 'none recorded'})`,
        timestamp: r.updatedAt,
        relevanceScore: scoreItem(`${r.title} ${r.description}`, tokens, project.slug, ctx.project),
      })
    }
  }
  for (const r of knowledgeService.listRisks(ctx.project)) {
    items.push({
      sourceType: 'Risk Register',
      sourceRef: `knowledge:${ctx.project}/risk:${r.id}`,
      project: ctx.project,
      title: r.title,
      summary: `${r.description} (severity: ${r.severity})`,
      timestamp: r.timestamp,
      relevanceScore: scoreItem(`${r.title} ${r.description}`, tokens, ctx.project, ctx.project),
    })
  }
  return { sourceType: 'Risk Register', items: topN(items) }
}

const retrieveTechnicalDebt: Retriever = (ctx, tokens) => {
  const items: KnowledgeItem[] = []
  for (const project of planningStateService.listProjects()) {
    for (const d of planningStateService.listTechnicalDebt(project.slug)) {
      items.push({
        sourceType: 'Technical Debt',
        sourceRef: `planning:${project.slug}/debt:${d.id}`,
        project: project.slug,
        title: d.title,
        summary: `${d.description} (priority: ${d.priority})`,
        timestamp: d.updatedAt,
        relevanceScore: scoreItem(`${d.title} ${d.description}`, tokens, project.slug, ctx.project),
      })
    }
  }
  for (const d of knowledgeService.listTechnicalDebt(ctx.project)) {
    items.push({
      sourceType: 'Technical Debt',
      sourceRef: `knowledge:${ctx.project}/debt:${d.id}`,
      project: ctx.project,
      title: d.title,
      summary: `${d.description} (priority: ${d.priority})`,
      timestamp: d.timestamp,
      relevanceScore: scoreItem(`${d.title} ${d.description}`, tokens, ctx.project, ctx.project),
    })
  }
  return { sourceType: 'Technical Debt', items: topN(items) }
}

const retrieveExistingMilestones: Retriever = (ctx, tokens) => {
  const items: KnowledgeItem[] = planningStateService.listAllMilestones().map(m => ({
    sourceType: 'Existing Milestone',
    sourceRef: `planning:${m.project}/milestone:${m.id}`,
    project: m.project,
    title: m.title,
    summary: `${m.description} (phase: ${m.phase}, status: ${m.status})`,
    timestamp: m.updatedAt,
    relevanceScore: scoreItem(`${m.title} ${m.description} ${m.phase}`, tokens, m.project, ctx.project),
  }))
  return { sourceType: 'Existing Milestone', items: topN(items) }
}

const retrieveExistingBatches: Retriever = (ctx, tokens) => {
  const items: KnowledgeItem[] = []
  for (const project of planningStateService.listProjects()) {
    for (const b of planningStateService.listBatches(project.slug)) {
      items.push({
        sourceType: 'Existing Delivery Batch',
        sourceRef: `planning:${project.slug}/batch:${b.id}`,
        project: project.slug,
        title: `${b.batchNumber} — ${b.objective.slice(0, 80)}`,
        summary: `${b.objective} (status: ${b.status})`,
        timestamp: b.updatedAt,
        relevanceScore: scoreItem(`${b.objective} ${b.summary}`, tokens, project.slug, ctx.project),
      })
    }
  }
  return { sourceType: 'Existing Delivery Batch', items: topN(items) }
}

// ---- Retrievers: Knowledge Service (permanent history) ----

const retrieveProductKnowledge: Retriever = (ctx, tokens) => {
  const items: KnowledgeItem[] = []
  for (const project of planningStateService.listProjects()) {
    for (const h of knowledgeService.listHandovers(project.slug)) {
      items.push({
        sourceType: 'Product Knowledge',
        sourceRef: `knowledge:${project.slug}/handover:${h.id}`,
        project: project.slug,
        title: `${h.phase}: ${h.objective.slice(0, 80)}`,
        summary: h.executiveSummary,
        timestamp: h.timestamp,
        relevanceScore: scoreItem(`${h.objective} ${h.executiveSummary}`, tokens, project.slug, ctx.project),
      })
    }
  }
  return { sourceType: 'Product Knowledge', items: topN(items) }
}

const retrieveKnowledgeServiceJournal: Retriever = (ctx, tokens) => {
  const entries = knowledgeService.listJournalEntries(ctx.project)
  const items: KnowledgeItem[] = entries.map(j => ({
    sourceType: 'Knowledge Service',
    sourceRef: `knowledge:${ctx.project}/journal:${j.id}`,
    project: ctx.project,
    title: 'Engineering Journal entry',
    summary: [j.summary, j.wins && `Wins: ${j.wins}`, j.problems && `Problems: ${j.problems}`, j.ideas && `Ideas: ${j.ideas}`].filter(Boolean).join(' | '),
    timestamp: j.timestamp,
    relevanceScore: scoreItem(`${j.summary} ${j.wins} ${j.problems} ${j.ideas} ${j.nextActions}`, tokens, ctx.project, ctx.project),
  }))
  return { sourceType: 'Knowledge Service', items: topN(items) }
}

// ---- Retrievers: this subsystem's own history ----

const retrievePreviousDirectives: Retriever = (ctx, tokens) => {
  const others = listInitiationRequests().filter(i => i.id !== ctx.excludeInitiationId)
  const items: KnowledgeItem[] = others.map(i => ({
    sourceType: 'Previous Executive Directive',
    sourceRef: `initiation:${i.id}`,
    project: i.project,
    title: i.directiveTitle,
    summary: i.directiveText.length > 500 ? `${i.directiveText.slice(0, 500)}…` : i.directiveText,
    timestamp: i.createdAt,
    relevanceScore: scoreItem(`${i.directiveTitle} ${i.directiveText}`, tokens, i.project, ctx.project),
  }))
  return { sourceType: 'Previous Executive Directive', items: topN(items) }
}

const retrievePreviousProgrammes: Retriever = (ctx, tokens) => {
  const others = listInitiationRequests().filter(i => i.id !== ctx.excludeInitiationId && i.generatedProgramme)
  const items: KnowledgeItem[] = others.map(i => {
    const programme = i.generatedProgramme!
    const milestoneTitles = programme.milestones.map(m => m.title).join(', ')
    return {
      sourceType: 'Previous Engineering Programme' as const,
      sourceRef: `initiation:${i.id}#programme`,
      project: i.project,
      title: `Prior programme for "${i.directiveTitle}"`,
      summary: `${programme.assessment.summary} Milestones: ${milestoneTitles}`,
      timestamp: i.updatedAt,
      relevanceScore: scoreItem(`${programme.assessment.summary} ${milestoneTitles}`, tokens, i.project, ctx.project),
    }
  })
  return { sourceType: 'Previous Engineering Programme', items: topN(items) }
}

// ---- Retrievers: structurally unavailable today (client-only stores) ----

const retrieveProjectDocumentation: Retriever = () => ({
  sourceType: 'Existing Project Documentation',
  items: [],
  unavailableReason: 'The Knowledge Base wiki (architecture notes, meeting notes) is a browser-only, localStorage-backed store (lib/dev/knowledgeData.ts) with no server-side persistence — unreachable from this server-side pipeline today.',
})

const retrievePromptLibrary: Retriever = () => ({
  sourceType: 'Prompt Library',
  items: [],
  unavailableReason: 'The Prompt Library is part of the same browser-only Knowledge Base wiki as Existing Project Documentation — no server-side store exists to retrieve it from today.',
})

const RETRIEVERS: Retriever[] = [
  retrieveProductKnowledge,
  retrieveProductDecisions,
  retrieveArchitectureDecisions,
  retrieveExistingMilestones,
  retrieveExistingBatches,
  retrieveRiskRegister,
  retrieveTechnicalDebt,
  retrievePreviousDirectives,
  retrievePreviousProgrammes,
  retrieveKnowledgeServiceJournal,
  retrieveProjectDocumentation,
  retrievePromptLibrary,
]

/** Engineering Standards is foundational, not ranked — always included in full when available. Static text describing this codebase's actual conventions, plus the server-owned Development Rules store (lib/dev/knowledge/developmentRulesStore.ts) when it has been configured. */
const STATIC_ENGINEERING_STANDARDS = `VYRON DEV builds on Next.js App Router with TypeScript. Server-owned state lives in small file-JSON stores behind a service layer (one service = the only writer for its domain, enforces invariants, publishes events). REST API routes under app/api are thin wrappers that call the service layer. UI is React Server/Client Components, built from shared primitives, styled with Tailwind. "Engineering work" means a new or modified TypeScript module, API route, UI component, automated script, test, or a written artifact committed into a durable store — never a verbal or organizational activity.`

function buildEngineeringStandards(): KnowledgeItem[] {
  const items: KnowledgeItem[] = [
    {
      sourceType: 'Engineering Standards',
      sourceRef: 'static:vyron-dev-conventions',
      project: null,
      title: 'VYRON DEV engineering conventions',
      summary: STATIC_ENGINEERING_STANDARDS,
      timestamp: null,
      relevanceScore: 1,
    },
  ]
  const rules = getDevelopmentRules()
  if (rules.content.trim()) {
    items.push({
      sourceType: 'Development Rules',
      sourceRef: 'knowledge:development-rules',
      project: null,
      title: 'VYRON DEV Development Rules',
      summary: rules.content,
      timestamp: rules.updatedAt,
      relevanceScore: 1,
    })
  }
  return items
}

/**
 * Runs every registered retriever against the given directive, ranks each
 * source's results by relevance, and returns a structured, attributable
 * result — never throwing (a single retriever's failure is caught and
 * turned into a gap so one broken source can never block generation) and
 * never blocking on a total absence of knowledge (requirement: continue
 * with the directive alone, recording the gap, when nothing is found).
 */
export function discoverKnowledge(ctx: KnowledgeDiscoveryContext): KnowledgeDiscoveryResult {
  const tokens = Array.from(new Set(tokenize(`${ctx.directiveTitle} ${ctx.directiveText}`)))
  const gaps: KnowledgeGap[] = []
  const organisationalKnowledge: KnowledgeItem[] = []

  for (const retrieve of RETRIEVERS) {
    let outcome: RetrieverOutcome
    try {
      outcome = retrieve(ctx, tokens)
    } catch (err) {
      gaps.push({ sourceType: 'Knowledge Service', reason: `Retrieval failed: ${err instanceof Error ? err.message : String(err)}` })
      continue
    }
    if (outcome.unavailableReason) {
      gaps.push({ sourceType: outcome.sourceType, reason: outcome.unavailableReason })
      continue
    }
    if (outcome.items.length === 0) {
      gaps.push({ sourceType: outcome.sourceType, reason: 'No relevant records found for this project or directive.' })
      continue
    }
    organisationalKnowledge.push(...outcome.items)
  }

  const engineeringStandards = buildEngineeringStandards()
  if (!engineeringStandards.some(i => i.sourceType === 'Development Rules')) {
    gaps.push({ sourceType: 'Development Rules', reason: 'No Development Rules have been configured yet (lib/dev/knowledge/developmentRulesStore.ts is empty).' })
  }

  return {
    organisationalKnowledge: organisationalKnowledge.sort((a, b) => b.relevanceScore - a.relevanceScore),
    engineeringStandards,
    gaps,
    retrievedAt: new Date().toISOString(),
    sourcesConsulted: RETRIEVERS.length + 1, // +1 for Engineering Standards/Development Rules
  }
}

import { RETRIEVERS, tokenizeQuery } from './engineeringIntelligenceRetrievers'
import type { PromptSection } from '../../promptIntelligenceEngine'
import type { KnowledgeGap, KnowledgeSourceType } from '../../knowledge/organisationalKnowledgeTypes'
import type {
  EngineeringIntelligenceQuery,
  EngineeringIntelligenceContext,
  EngineeringIntelligenceSection,
  EngineeringIntelligenceAttribution,
} from './engineeringIntelligenceTypes'

/**
 * Orchestrates the Engineering Intelligence pipeline: runs every
 * registered retriever (never throwing — one retriever's failure
 * becomes a gap, exactly like knowledgeDiscovery.ts's discoverKnowledge,
 * so one broken source can never block a batch from starting), enforces
 * a total prompt-size budget, and exposes the result both as
 * prompt-ready sections and as a durable attribution summary.
 */

/**
 * A hard ceiling on how much retrieved-knowledge text this pipeline adds
 * to one batch's prompt. Claude CLI receives the prompt as a single argv
 * entry (lib/dev/runtime/executionProviders/claudeCodeProvider.ts —
 * `spawn('claude', ['-p', job.prompt, ...], { shell: false })`), which on
 * Windows still has a real command-line length ceiling even without a
 * shell in between; nothing in this codebase capped total prompt size
 * before this pipeline existed, because nothing added enough content to
 * matter until now. Kept generous relative to a single batch's needs
 * while staying an order of magnitude under any practical limit.
 */
const TOTAL_CHARACTER_BUDGET = 6000

/** These five are cheap (already-frozen snapshot data, or static text) and foundational — never subject to the budget cut, matching how buildServerAutonomousPrompt already always includes their equivalents today. */
const FOUNDATIONAL_SOURCE_TYPES = new Set<KnowledgeSourceType>([
  'Architecture Decision Record',
  'Technical Debt',
  'Risk Register',
  'Development Rules',
  'Engineering Standards',
])

function sectionCharCount(section: EngineeringIntelligenceSection): number {
  return section.items.reduce((sum, i) => sum + i.title.length + i.summary.length, 0)
}

function bestRelevance(section: EngineeringIntelligenceSection): number {
  return section.items.reduce((max, i) => Math.max(max, i.relevanceScore), 0)
}

export function buildEngineeringIntelligenceContext(query: EngineeringIntelligenceQuery): EngineeringIntelligenceContext {
  const tokens = tokenizeQuery(query.queryText)
  const gaps: KnowledgeGap[] = []
  const rawSections: EngineeringIntelligenceSection[] = []

  for (const retrieve of RETRIEVERS) {
    let outcome
    try {
      outcome = retrieve(query, tokens)
    } catch (err) {
      // Same fallback bucket knowledgeDiscovery.ts's discoverKnowledge already
      // uses for an unexpected retriever exception — 'Knowledge Service' is
      // this codebase's established generic catch-all, not a claim that the
      // Knowledge Service itself failed.
      gaps.push({ sourceType: 'Knowledge Service', reason: `Retrieval failed: ${err instanceof Error ? err.message : String(err)}` })
      continue
    }
    if (outcome.unavailableReason) {
      gaps.push({ sourceType: outcome.sourceType, reason: outcome.unavailableReason })
      continue
    }
    if (outcome.items.length === 0) {
      gaps.push({ sourceType: outcome.sourceType, reason: 'No relevant records found for this project or batch.' })
      continue
    }
    rawSections.push({ sourceType: outcome.sourceType, items: outcome.items })
  }

  // Budget pass — foundational sections are always kept; everything else
  // is ranked by its most relevant item and greedily included until the
  // character budget runs out. Anything cut becomes an honest gap
  // ("omitted to stay within prompt size limits"), never silently dropped.
  const foundational = rawSections.filter(s => FOUNDATIONAL_SOURCE_TYPES.has(s.sourceType))
  const rest = rawSections
    .filter(s => !FOUNDATIONAL_SOURCE_TYPES.has(s.sourceType))
    .sort((a, b) => bestRelevance(b) - bestRelevance(a))

  const kept: EngineeringIntelligenceSection[] = [...foundational]
  let used = foundational.reduce((sum, s) => sum + sectionCharCount(s), 0)

  for (const section of rest) {
    const size = sectionCharCount(section)
    if (used + size > TOTAL_CHARACTER_BUDGET) {
      gaps.push({ sourceType: section.sourceType, reason: 'Additional relevant knowledge was found but omitted to stay within prompt size limits.' })
      continue
    }
    used += size
    kept.push(section)
  }

  return {
    sections: kept,
    gaps,
    retrievedAt: new Date().toISOString(),
    sourcesConsulted: RETRIEVERS.length,
  }
}

/** Requirement 6 — "every AI output shall record which knowledge sources influenced the result." Consumed by serverExecutionLoop.ts and attached to the batch's Handover record. */
export function summarizeAttribution(context: EngineeringIntelligenceContext): EngineeringIntelligenceAttribution {
  return {
    sourceRefs: context.sections.flatMap(s => s.items.map(i => i.sourceRef)),
    sourceTypesConsulted: context.sections.map(s => s.sourceType),
    gapSourceTypes: context.gaps.map(g => g.sourceType),
  }
}

/**
 * Turns the structured context into prompt sections — `alreadyCoveredSourceTypes`
 * lets the caller (serverContextBuilder.ts's buildServerAutonomousPrompt)
 * skip re-emitting content its own existing sections already show (the
 * four snapshot-reused categories render there, under their existing
 * headings, not duplicated here under a second one).
 */
export function renderEngineeringIntelligenceSections(
  context: EngineeringIntelligenceContext,
  alreadyCoveredSourceTypes: KnowledgeSourceType[]
): PromptSection[] {
  const covered = new Set(alreadyCoveredSourceTypes)
  const sections: PromptSection[] = context.sections
    .filter(s => !covered.has(s.sourceType))
    .map(s => ({
      heading: `Organisational Knowledge: ${s.sourceType}`,
      content: s.items.map(i => `- ${i.title}: ${i.summary}`).join('\n'),
    }))

  const gapLines = context.gaps.filter(g => !covered.has(g.sourceType)).map(g => `- ${g.sourceType}: ${g.reason}`)
  if (gapLines.length > 0) {
    sections.push({ heading: 'Engineering Intelligence — Knowledge Gaps', content: gapLines.join('\n') })
  }

  return sections
}

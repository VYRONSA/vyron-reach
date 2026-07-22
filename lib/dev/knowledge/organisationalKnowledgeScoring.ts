import type { KnowledgeItem } from './organisationalKnowledgeTypes'

/**
 * Shared lexical relevance scoring for every organisational-knowledge
 * retrieval pipeline (Initiation's Knowledge Discovery, the Director's
 * Engineering Intelligence pipeline). Extracted from
 * lib/dev/initiation/knowledgeDiscovery.ts, which originally defined
 * this locally — behavior is unchanged, only the location moved, so a
 * second pipeline doesn't have to redefine the same tokenizer/scorer.
 *
 * Deliberately simple and explainable — a fraction of the query's
 * significant words that also appear in an item's text, plus a flat
 * same-project bonus — consistent with this codebase's existing
 * hand-rolled search (lib/dev/query/queryHelpers.ts) rather than
 * embeddings/vector-search infrastructure this app has none of.
 */

export const MAX_ITEMS_PER_SOURCE = 5

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'is', 'are', 'be', 'this', 'that', 'with', 'as',
  'by', 'it', 'its', 'from', 'at', 'will', 'shall', 'not', 'do', 'does', 'has', 'have', 'had', 'was', 'were',
  'their', 'them', 'they', 'we', 'you', 'your', 'all', 'any', 'so', 'if', 'into', 'can', 'should', 'must',
])

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 2 && !STOPWORDS.has(t))
}

/** `itemProject`/`targetProject` — pass `null` for either side when the item or the query has no single owning project (e.g. cross-cutting knowledge); the same-project bonus simply never applies in that case. */
export function scoreItem(text: string, queryTokens: string[], itemProject: string | null, targetProject: string | null): number {
  const targetTokens = new Set(tokenize(text))
  const overlap = queryTokens.length === 0 ? 0 : queryTokens.filter(t => targetTokens.has(t)).length / queryTokens.length
  const sameProjectBonus = itemProject !== null && itemProject === targetProject ? 0.35 : 0
  return Math.min(1, overlap + sameProjectBonus)
}

export function topN(items: KnowledgeItem[], n = MAX_ITEMS_PER_SOURCE): KnowledgeItem[] {
  return [...items].sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, n)
}

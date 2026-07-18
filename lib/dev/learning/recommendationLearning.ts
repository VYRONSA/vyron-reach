import type { ExecutionLearningRecord, RecommendationOutcome, RecommendationRecord } from './learningTypes'

const STOPWORDS = new Set(['the', 'a', 'an', 'and', 'or', 'to', 'of', 'for', 'in', 'on', 'with', 'this', 'that', 'batch', 'continue'])

function significantWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(w => w.length > 3 && !STOPWORDS.has(w))
  )
}

function overlapRatio(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let shared = 0
  for (const word of a) if (b.has(word)) shared++
  return shared / Math.min(a.size, b.size)
}

/**
 * A recommendation is only ever marked Accepted when a later execution's
 * objective genuinely overlaps with its text (>= 40% of significant
 * words shared) — a conservative, honest threshold. Anything that
 * doesn't clear it is Unknown, never guessed as Rejected/Overridden;
 * this system has no explicit "I rejected this recommendation" signal to
 * read, so it never claims to know that with certainty.
 */
export function evaluateRecommendationOutcomes(records: ExecutionLearningRecord[]): RecommendationRecord[] {
  const chronological = [...records].sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1))
  const results: RecommendationRecord[] = []

  chronological.forEach((record, index) => {
    for (const text of record.recommendations) {
      const recWords = significantWords(text)
      const later = chronological.slice(index + 1, index + 4)
      const matched = later.some(l => overlapRatio(recWords, significantWords(`${l.objective} ${l.taskTitle ?? ''}`)) >= 0.4)
      const outcome: RecommendationOutcome = matched ? 'Accepted' : later.length > 0 ? 'Overridden' : 'Unknown'
      results.push({ text, madeAt: record.timestamp, project: record.projectSlug, outcome })
    }
  })

  return results
}

/** Accuracy = the share of recommendations with a KNOWN outcome (Accepted or Overridden) that were actually Accepted — Unknown outcomes are excluded rather than counted against or for accuracy. Null when there isn't enough resolved history to say anything honest. */
export function computeRecommendationAccuracy(records: RecommendationRecord[]): number | null {
  const resolved = records.filter(r => r.outcome === 'Accepted' || r.outcome === 'Overridden')
  if (resolved.length === 0) return null
  const accepted = resolved.filter(r => r.outcome === 'Accepted').length
  return Math.round((accepted / resolved.length) * 100)
}

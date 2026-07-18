import { KNOWLEDGE_SECTIONS, getKnowledgeNote } from '../knowledgeData'
import type { ExecutionLearningRecord, EngineeringMemoryEntry } from './learningTypes'

/**
 * Extracts one memory entry from a successfully-applied execution — the
 * summary is built entirely from that execution's own recorded fields
 * (objective, recommendations), never AI-generated or authored prose.
 * Returns null for anything that isn't a genuine success: this module
 * never records "how something works" from a failed or rejected attempt.
 */
export function extractMemoryFromExecution(record: ExecutionLearningRecord): EngineeringMemoryEntry | null {
  if (record.outcome !== 'Succeeded') return null
  const topic = record.taskTitle ?? record.objective
  if (!topic) return null

  const summaryParts = [record.objective]
  if (record.recommendations.length > 0) summaryParts.push(`Follow-up: ${record.recommendations[0]}`)

  return {
    id: `memory_${record.id}`,
    topic,
    summary: summaryParts.join(' '),
    evidenceExecutionIds: [record.id],
    source: 'Learned',
    createdAt: record.timestamp,
  }
}

/**
 * Searchable knowledge — composes learned entries (from real successful
 * executions) with the existing, human-authored Knowledge Base notes
 * (lib/dev/knowledgeData.ts), which are real, persisted content this
 * engine reuses rather than duplicates. Matching is a literal substring
 * search over topic/summary/content, not a semantic embedding search —
 * "semantic" in the batch spec is interpreted as "search by meaning-
 * bearing keywords across every knowledge source," the only honest
 * implementation available without a real embeddings/vector-search
 * capability, which this system does not have.
 */
export function searchEngineeringMemory(query: string, learnedEntries: EngineeringMemoryEntry[]): EngineeringMemoryEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const results: EngineeringMemoryEntry[] = learnedEntries.filter(
    e => e.topic.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q)
  )

  for (const section of KNOWLEDGE_SECTIONS) {
    const note = getKnowledgeNote(section.slug)
    if (note.content.toLowerCase().includes(q)) {
      results.push({
        id: `kb_${section.slug}`,
        topic: section.title,
        summary: note.content.slice(0, 240),
        evidenceExecutionIds: [],
        source: 'Knowledge Base',
        createdAt: note.updatedAt,
      })
    }
  }

  return results
}

import type {
  ArchitectureKnowledgeEntry,
  DecisionMemoryEntry,
  EngineeringDNAEntry,
  EngineeringMemoryEntry,
  EngineeringPattern,
} from './learningTypes'

export type KnowledgeSearchResult = {
  query: string
  decisions: DecisionMemoryEntry[]
  memory: EngineeringMemoryEntry[]
  architecture: ArchitectureKnowledgeEntry[]
  dna: EngineeringDNAEntry[]
  patterns: EngineeringPattern[]
  totalResults: number
}

/**
 * Unified engineering search across every knowledge source this module
 * builds — "Show every Runtime issue" / "Show every Xero lesson" /
 * "Show every migration problem" all resolve to the same literal,
 * case-insensitive substring match applied uniformly across decisions,
 * memory, architecture knowledge, DNA, and patterns. This is a keyword
 * search, not a real semantic/embedding search — this system has no
 * vector index or embeddings capability, so nothing here pretends to
 * understand meaning beyond literal text overlap.
 */
export function searchKnowledge(
  query: string,
  sources: {
    decisions: DecisionMemoryEntry[]
    memory: EngineeringMemoryEntry[]
    architecture: ArchitectureKnowledgeEntry[]
    dna: EngineeringDNAEntry[]
    patterns: EngineeringPattern[]
  }
): KnowledgeSearchResult {
  const q = query.trim().toLowerCase()
  const matches = (text: string) => q !== '' && text.toLowerCase().includes(q)

  const decisions = sources.decisions.filter(d => matches(`${d.decision} ${d.reason} ${d.alternatives}`))
  const memory = sources.memory.filter(m => matches(`${m.topic} ${m.summary}`))
  const architecture = sources.architecture.filter(a => matches(`${a.title} ${a.description}`))
  const dna = sources.dna.filter(d => matches(`${d.title} ${d.description} ${d.category}`))
  const patterns = sources.patterns.filter(p => matches(`${p.category} ${p.description}`))

  return {
    query,
    decisions,
    memory,
    architecture,
    dna,
    patterns,
    totalResults: decisions.length + memory.length + architecture.length + dna.length + patterns.length,
  }
}

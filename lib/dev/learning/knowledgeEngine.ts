import { detectPatterns } from './patternRecognition'
import { findRelevantDNA } from './engineeringDNA'
import type {
  EngineeringDNAProfile,
  EngineeringMemoryEntry,
  ExecutionLearningRecord,
  LearningConfidence,
  RelevantKnowledge,
} from './learningTypes'

function significantWords(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 3))
}

function overlaps(a: Set<string>, b: Set<string>): boolean {
  for (const w of a) if (b.has(w)) return true
  return false
}

function findSimilarExecutions(taskText: string, records: ExecutionLearningRecord[]): ExecutionLearningRecord[] {
  const taskWords = significantWords(taskText)
  if (taskWords.size === 0) return []
  return records.filter(r => overlaps(taskWords, significantWords(`${r.objective} ${r.taskTitle ?? ''}`))).slice(0, 5)
}

function findRelevantMemory(taskText: string, entries: EngineeringMemoryEntry[]): EngineeringMemoryEntry[] {
  const taskWords = significantWords(taskText)
  if (taskWords.size === 0) return []
  return entries.filter(e => overlaps(taskWords, significantWords(`${e.topic} ${e.summary}`))).slice(0, 5)
}

function determineConfidence(similarExecutions: ExecutionLearningRecord[], dnaEntries: unknown[]): LearningConfidence {
  const evidenceCount = similarExecutions.length + dnaEntries.length
  if (evidenceCount >= 3) return 'High'
  if (evidenceCount >= 1) return 'Medium'
  return 'Low'
}

/**
 * The Knowledge Engine — the query/retrieval half of this module, called
 * BEFORE an execution (the write/record half is learningEngine.ts,
 * called after). Composes Pattern Recognition, Engineering DNA, and
 * Engineering Memory over already-persisted history for one project —
 * nothing here computes anything new about the current task, only
 * retrieves what past executions already established. Confidence is Low
 * whenever there's little or no matching history, never inflated: this
 * system's real execution history is still thin, and that honestly
 * shows up here as Low confidence until it accumulates.
 */
export function queryRelevantKnowledge(
  taskText: string,
  projectSlug: string,
  allRecords: ExecutionLearningRecord[],
  dnaProfile: EngineeringDNAProfile,
  memoryEntries: EngineeringMemoryEntry[]
): RelevantKnowledge {
  const projectRecords = allRecords.filter(r => r.projectSlug === projectSlug)
  const patterns = detectPatterns(projectRecords)
  const dnaEntries = findRelevantDNA(dnaProfile, taskText)
  const similarExecutions = findSimilarExecutions(taskText, projectRecords)
  const relevantMemory = findRelevantMemory(taskText, memoryEntries)

  return {
    memoryEntries: relevantMemory,
    dnaEntries,
    patterns,
    similarExecutions,
    confidence: determineConfidence(similarExecutions, dnaEntries),
  }
}

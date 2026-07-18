import { extractMemoryFromExecution } from './engineeringMemory'
import { extractDNACandidates, evolveDNA } from './engineeringDNA'
import { detectPatterns } from './patternRecognition'
import { buildAgentScorecards, mostAccurateAgent, leastAccurateAgent } from './agentPerformance'
import { evaluateRecommendationOutcomes, computeRecommendationAccuracy } from './recommendationLearning'
import { successfulApproaches, rejectedApproaches } from './decisionMemory'
import { buildArchitectureKnowledge } from './architectureKnowledge'
import type {
  DecisionMemoryEntry,
  EngineeringDNAEntry,
  EngineeringDNAProfile,
  EngineeringMemoryEntry,
  EngineeringPattern,
  ExecutionLearningRecord,
  LearningConfidence,
  LearningReport,
} from './learningTypes'

export type LearningUpdate = {
  record: ExecutionLearningRecord
  newMemoryEntry: EngineeringMemoryEntry | null
  newDNAEntries: EngineeringDNAEntry[]
  patternsAfter: EngineeringPattern[]
}

/**
 * The write half of the Engineering Knowledge, Learning & DNA Engine —
 * called once per completed execution, after the Development Completion
 * Engine and Operations pipeline have already run. Composes the
 * extraction functions this module already built; the caller (an API
 * route, since this needs the server-side stores) is responsible for
 * actually persisting whatever comes back — this function performs no
 * I/O itself, keeping it pure and independently testable.
 */
export function processExecutionForLearning(
  record: ExecutionLearningRecord,
  existingDNAProfile: EngineeringDNAProfile,
  allPriorRecords: ExecutionLearningRecord[]
): LearningUpdate {
  const newMemoryEntry = extractMemoryFromExecution(record)
  const candidates = extractDNACandidates(record)
  const newDNAEntries = evolveDNA(candidates, record.projectSlug, existingDNAProfile)
  const patternsAfter = detectPatterns([record, ...allPriorRecords])

  return { record, newMemoryEntry, newDNAEntries, patternsAfter }
}

function determineLearningConfidence(records: ExecutionLearningRecord[]): LearningConfidence {
  if (records.length >= 10) return 'High'
  if (records.length >= 3) return 'Medium'
  return 'Low'
}

/**
 * The Learning Intelligence report (module 10). Every field is a direct
 * read or simple aggregation over the same records/decisions/scorecards
 * already computed elsewhere in this module — nothing new is derived
 * here. With few real executions on record (true for this system today),
 * most fields honestly come back empty/null and learningConfidence is
 * Low — that's the correct output, not a bug to paper over.
 */
export function generateLearningReport(
  records: ExecutionLearningRecord[],
  decisions: DecisionMemoryEntry[],
  dnaChanges: EngineeringDNAEntry[],
  newKnowledge: EngineeringMemoryEntry[]
): LearningReport {
  const patterns = detectPatterns(records)
  const scorecards = buildAgentScorecards(records)
  const recommendationRecords = evaluateRecommendationOutcomes(records)
  const architectureEntries = buildArchitectureKnowledge(records, decisions)

  const lessonsLearned = [
    ...patterns.map(p => `${p.category}: ${p.description} (${p.frequency} occurrence(s)).`),
    ...rejectedApproaches(decisions).map(d => `Rejected approach: ${d.decision} — ${d.reason}`),
  ]

  return {
    lessonsLearned,
    newKnowledge,
    patternsDetected: patterns,
    dnaChanges,
    mostSuccessfulDecisions: successfulApproaches(decisions).slice(0, 5),
    leastSuccessfulDecisions: rejectedApproaches(decisions).slice(0, 5),
    mostAccurateAgent: mostAccurateAgent(scorecards),
    leastAccurateAgent: leastAccurateAgent(scorecards),
    recommendationAccuracy: computeRecommendationAccuracy(recommendationRecords),
    architectureImprovements: architectureEntries.filter(e => e.category === 'Best Practice').map(e => e.title),
    knowledgeGrowth: newKnowledge.length + dnaChanges.length,
    learningConfidence: determineLearningConfidence(records),
  }
}

import type { Decision } from '../decisionsStorage'
import type { DecisionMemoryEntry, DecisionTopic } from './learningTypes'

const TOPIC_KEYWORDS: [DecisionTopic, RegExp][] = [
  ['Security', /security|auth|secret|vulnerab|encrypt/i],
  ['Database', /database|supabase|sql|migration|schema/i],
  ['AI', /\bai\b|claude|prompt|runtime execution|agent/i],
  ['Performance', /performance|speed|latency|optimi[sz]e/i],
  ['Architecture', /architecture|refactor|structure|pattern|coupling/i],
]

function classifyTopic(decision: Decision): DecisionTopic {
  const text = `${decision.decision} ${decision.reason}`
  for (const [topic, pattern] of TOPIC_KEYWORDS) {
    if (pattern.test(text)) return topic
  }
  return 'General'
}

/**
 * Decision Memory — pure composition over the existing Architecture
 * Decisions store (lib/dev/decisionsStorage.ts), never a parallel record
 * of its own. "Never lose previous reasoning" is already true by
 * construction: every Decision record already carries its own
 * reason/alternatives, and this module only reads and categorizes them,
 * never edits or removes one. `successful` reflects the decision's own
 * recorded status — 'Approved' is treated as successful, 'Rejected' as
 * not, anything else (Proposed/Superseded) as unknown rather than guessed.
 */
export function buildDecisionMemory(decisions: Decision[]): DecisionMemoryEntry[] {
  return decisions.map(d => ({
    decisionId: d.id,
    topic: classifyTopic(d),
    decision: d.decision,
    reason: d.reason,
    alternatives: d.alternatives,
    status: d.status,
    project: d.relatedProject,
    successful: d.status === 'Approved' ? true : d.status === 'Rejected' ? false : null,
  }))
}

export function decisionsByTopic(entries: DecisionMemoryEntry[], topic: DecisionTopic): DecisionMemoryEntry[] {
  return entries.filter(e => e.topic === topic)
}

export function rejectedApproaches(entries: DecisionMemoryEntry[]): DecisionMemoryEntry[] {
  return entries.filter(e => e.successful === false)
}

export function successfulApproaches(entries: DecisionMemoryEntry[]): DecisionMemoryEntry[] {
  return entries.filter(e => e.successful === true)
}

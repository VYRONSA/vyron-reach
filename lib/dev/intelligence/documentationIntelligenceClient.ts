import { KNOWLEDGE_SECTIONS, getKnowledgeNote } from '../knowledgeData'
import type { Batch } from '../batchesStorage'
import type { Decision } from '../decisionsStorage'
import type { EngineeringFinding } from './types'

const MISSING_DECISIONS_BATCH_THRESHOLD = 3

/**
 * Client-side (localStorage) half of Documentation Intelligence. "Outdated
 * documentation" is scoped to "never written at all" — comparing a note's
 * prose against actual code drift isn't something this engine can honestly
 * claim to judge. "Missing architecture decisions" is a plain count: real
 * batch activity with zero Decision records logged anywhere for the
 * project.
 */
export function scanDocumentationIntelligenceClient(slug: string, completedBatches: Batch[], decisions: Decision[]): EngineeringFinding[] {
  const findings: EngineeringFinding[] = []

  for (const section of KNOWLEDGE_SECTIONS) {
    const note = getKnowledgeNote(section.slug)
    if (!note.content.trim()) {
      findings.push({
        module: 'Documentation',
        category: 'Missing Documentation',
        severity: 'Low',
        title: `Knowledge Base section "${section.title}" is empty`,
        evidence: `getKnowledgeNote('${section.slug}').content is empty.`,
        location: `/dev/knowledge/${section.slug}`,
        recommendation: `Write the "${section.title}" knowledge base note.`,
      })
    }
  }

  if (completedBatches.length >= MISSING_DECISIONS_BATCH_THRESHOLD && decisions.length === 0) {
    findings.push({
      module: 'Documentation',
      category: 'Missing Architecture Decisions',
      severity: 'Low',
      title: `${completedBatches.length} completed batches with zero recorded decisions`,
      evidence: `${completedBatches.length} batches marked Complete for "${slug}"; 0 Decision records reference this project.`,
      location: '/dev/decisions',
      recommendation: 'Log the key architecture decisions made across these batches.',
    })
  }

  return findings
}

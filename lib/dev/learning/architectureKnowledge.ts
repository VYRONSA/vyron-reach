import type { DecisionMemoryEntry } from './learningTypes'
import type { ExecutionLearningRecord, ArchitectureKnowledgeEntry } from './learningTypes'

/**
 * Reusable knowledge is only ever extracted from files a SUCCESSFUL
 * execution actually created — never from modified files (which could
 * just as easily be a fix to something broken) and never from a failed
 * or rejected attempt. Best Practices and Anti-Patterns reuse Decision
 * Memory directly (Approved → best practice candidate, Rejected →
 * anti-pattern candidate) rather than re-deriving a success judgment.
 */
export function buildArchitectureKnowledge(
  records: ExecutionLearningRecord[],
  decisions: DecisionMemoryEntry[]
): ArchitectureKnowledgeEntry[] {
  const entries: ArchitectureKnowledgeEntry[] = []
  const successful = records.filter(r => r.outcome === 'Succeeded')

  for (const record of successful) {
    for (const file of record.filesCreated) {
      const entry = classifyFile(file, record)
      if (entry) entries.push(entry)
    }
  }

  for (const decision of decisions.filter(d => d.successful === true)) {
    entries.push({
      category: 'Best Practice',
      title: decision.decision,
      description: decision.reason,
      evidenceExecutionIds: [],
      projectsUsed: [decision.project].filter(Boolean),
    })
  }
  for (const decision of decisions.filter(d => d.successful === false)) {
    entries.push({
      category: 'Anti-Pattern',
      title: decision.decision,
      description: `Rejected: ${decision.reason}${decision.alternatives ? ` (alternative considered: ${decision.alternatives})` : ''}`,
      evidenceExecutionIds: [],
      projectsUsed: [decision.project].filter(Boolean),
    })
  }

  return entries
}

function classifyFile(file: string, record: ExecutionLearningRecord): ArchitectureKnowledgeEntry | null {
  const base = { evidenceExecutionIds: [record.id], projectsUsed: [record.projectSlug] }
  if (file.endsWith('.sql')) {
    return { ...base, category: 'Reusable SQL', title: file, description: `SQL introduced by "${record.objective}".` }
  }
  if (/prompt/i.test(file)) {
    return { ...base, category: 'Reusable Prompt', title: file, description: `Prompt-related module introduced by "${record.objective}".` }
  }
  if (file.startsWith('components/')) {
    return { ...base, category: 'Reusable Component', title: file, description: `Component introduced by "${record.objective}".` }
  }
  if (file.startsWith('lib/dev/') && file.endsWith('.ts')) {
    return { ...base, category: 'Reusable Service', title: file, description: `Service introduced by "${record.objective}".` }
  }
  return null
}

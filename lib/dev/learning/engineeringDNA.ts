import type { EngineeringDNAEntry, EngineeringDNAProfile, ExecutionLearningRecord } from './learningTypes'

type DNACandidate = { category: string; title: string; description: string }

/**
 * Candidate DNA facts from one successful execution — never from a
 * failed, rejected, or rolled-back one, satisfying "every Engineering
 * DNA entry must reference one or more successful executions" at the
 * source. Two kinds of candidates: the execution's own theme/objective
 * (what kind of work this was and what it accomplished), and each file
 * it genuinely created (a reusable asset this product now has). Nothing
 * here is prose generated about the domain — it's a direct transcription
 * of fields the execution itself already recorded.
 */
export function extractDNACandidates(record: ExecutionLearningRecord): DNACandidate[] {
  if (record.outcome !== 'Succeeded') return []
  const candidates: DNACandidate[] = []

  if (record.taskTitle) {
    candidates.push({
      category: record.directorTheme ?? 'Engineering Knowledge',
      title: record.taskTitle,
      description: record.objective,
    })
  }
  for (const file of record.filesCreated) {
    candidates.push({ category: 'Reusable Component', title: file, description: `Introduced by "${record.objective}".` })
  }
  return candidates
}

let versionCounter = 0
function nextDNAId(productSlug: string): string {
  versionCounter += 1
  return `dna_${productSlug}_${Date.now()}_${versionCounter}`
}

/**
 * Evolves a product's DNA profile with new candidates from one execution.
 * A candidate matching an existing entry's category+title becomes a new,
 * higher-numbered version that supersedes it — the old version is never
 * deleted, only superseded, so DNA is never overwritten. A genuinely new
 * category+title becomes a fresh entry at version 1. Returns only the
 * NEW entries created (what changed), for the caller to persist and
 * report on — this function itself never touches storage.
 */
export function evolveDNA(candidates: DNACandidate[], productSlug: string, existingProfile: EngineeringDNAProfile): EngineeringDNAEntry[] {
  const now = new Date().toISOString()
  const newEntries: EngineeringDNAEntry[] = []

  for (const candidate of candidates) {
    const existing = existingProfile.current.find(e => e.category === candidate.category && e.title === candidate.title)
    if (existing && existing.description === candidate.description) continue // identical fact already current — no duplicate learning

    newEntries.push({
      id: nextDNAId(productSlug),
      productSlug,
      category: candidate.category,
      title: candidate.title,
      description: candidate.description,
      evidenceExecutionIds: existing ? [...existing.evidenceExecutionIds] : [],
      version: existing ? existing.version + 1 : 1,
      createdAt: now,
      supersedes: existing?.id ?? null,
    })
  }

  return newEntries
}

/** The subset of a product's current DNA relevant to a new task — matched by literal word overlap between the task's own text and the DNA entry's title/category, the same discipline used everywhere else in this system rather than a semantic/embedding search this system doesn't have. */
export function findRelevantDNA(profile: EngineeringDNAProfile, taskText: string): EngineeringDNAEntry[] {
  const taskWords = new Set(taskText.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 3))
  if (taskWords.size === 0) return []
  return profile.current.filter(e => {
    const entryWords = `${e.title} ${e.category}`.toLowerCase().split(/[^a-z0-9]+/)
    return entryWords.some(w => w.length > 3 && taskWords.has(w))
  })
}

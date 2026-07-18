import type { EngineeringPattern, ExecutionLearningRecord } from './learningTypes'

const REPEAT_THRESHOLD = 2

function confidenceFromFrequency(frequency: number): EngineeringPattern['confidence'] {
  if (frequency >= 5) return 'High'
  if (frequency >= 3) return 'Medium'
  return 'Low'
}

/** Executions whose findingCategoryCounts include the given module:category key at least once. */
function executionsWithFindingKey(records: ExecutionLearningRecord[], key: string): ExecutionLearningRecord[] {
  return records.filter(r => (r.findingCategoryCounts[key] ?? 0) > 0)
}

function patternFromFindingKey(
  records: ExecutionLearningRecord[],
  key: string,
  category: EngineeringPattern['category'],
  description: string
): EngineeringPattern | null {
  const matches = executionsWithFindingKey(records, key)
  if (matches.length < REPEAT_THRESHOLD) return null
  return {
    category,
    description,
    evidence: matches.map(m => m.id),
    frequency: matches.length,
    projectsAffected: [...new Set(matches.map(m => m.projectSlug))],
    confidence: confidenceFromFrequency(matches.length),
  }
}

function groupByNormalizedText(items: { id: string; project: string; text: string }[]): Map<string, { id: string; project: string }[]> {
  const groups = new Map<string, { id: string; project: string }[]>()
  for (const item of items) {
    const key = item.text.trim().toLowerCase()
    if (!key) continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push({ id: item.id, project: item.project })
  }
  return groups
}

function repeatedRecommendations(records: ExecutionLearningRecord[]): EngineeringPattern[] {
  const items = records.flatMap(r => r.recommendations.map(text => ({ id: r.id, project: r.projectSlug, text })))
  const groups = groupByNormalizedText(items)
  const patterns: EngineeringPattern[] = []
  for (const [text, occurrences] of groups) {
    if (occurrences.length < REPEAT_THRESHOLD) continue
    patterns.push({
      category: 'Repeated Recommendation',
      description: text,
      evidence: occurrences.map(o => o.id),
      frequency: occurrences.length,
      projectsAffected: [...new Set(occurrences.map(o => o.project))],
      confidence: confidenceFromFrequency(occurrences.length),
    })
  }
  return patterns
}

const REFACTOR_KEYWORDS = /\brefactor|cleanup|clean up|simplify|consolidat/i

function repeatedRefactors(records: ExecutionLearningRecord[]): EngineeringPattern | null {
  const matches = records.filter(r => REFACTOR_KEYWORDS.test(`${r.objective} ${r.taskTitle ?? ''}`))
  if (matches.length < REPEAT_THRESHOLD) return null
  return {
    category: 'Repeated Refactor',
    description: 'Multiple executions targeted refactoring/cleanup/consolidation work.',
    evidence: matches.map(m => m.id),
    frequency: matches.length,
    projectsAffected: [...new Set(matches.map(m => m.projectSlug))],
    confidence: confidenceFromFrequency(matches.length),
  }
}

function repeatedBugs(records: ExecutionLearningRecord[]): EngineeringPattern[] {
  const failed = records.filter(r => r.outcome === 'Failed')
  const items = failed.map(r => ({ id: r.id, project: r.projectSlug, text: (r.taskTitle ?? r.objective).split(' ').slice(0, 4).join(' ') }))
  const groups = groupByNormalizedText(items)
  const patterns: EngineeringPattern[] = []
  for (const [text, occurrences] of groups) {
    if (occurrences.length < REPEAT_THRESHOLD || !text) continue
    patterns.push({
      category: 'Repeated Bug',
      description: `Executions starting with "${text}" have failed repeatedly.`,
      evidence: occurrences.map(o => o.id),
      frequency: occurrences.length,
      projectsAffected: [...new Set(occurrences.map(o => o.project))],
      confidence: confidenceFromFrequency(occurrences.length),
    })
  }
  return patterns
}

/**
 * Detects the ten pattern categories the batch spec lists — each from a
 * real, checkable signal already persisted on ExecutionLearningRecord.
 * "Repeated Deployment Failure" is deliberately never emitted: this
 * system has no deployment-outcome tracking (confirmed in the Operations
 * Platform batch — deploymentSuccess is always null), so there is no
 * honest evidence to build that pattern from. Every other category
 * requires at least REPEAT_THRESHOLD occurrences before being reported —
 * a single instance is a finding, not yet a pattern.
 */
export function detectPatterns(records: ExecutionLearningRecord[]): EngineeringPattern[] {
  const patterns: EngineeringPattern[] = []

  const architectureViolation = patternFromFindingKey(
    records,
    'Code:Architecture Violation',
    'Repeated Architecture Violation',
    'Architecture Violation findings recurred across multiple executions.'
  )
  if (architectureViolation) patterns.push(architectureViolation)

  const securityFinding = patternFromFindingKey(
    records,
    'Quality:Security Concern',
    'Repeated Security Finding',
    'Security Concern findings recurred across multiple executions.'
  )
  if (securityFinding) patterns.push(securityFinding)

  const buildFailure = patternFromFindingKey(
    records,
    'Build:Failed Build',
    'Repeated Build Failure',
    'The build failed in multiple executions.'
  )
  if (buildFailure) patterns.push(buildFailure)

  const typescriptFailure = patternFromFindingKey(
    records,
    'Build:TypeScript Failing',
    'Repeated TypeScript Failure',
    'TypeScript checks failed in multiple executions.'
  )
  if (typescriptFailure) patterns.push(typescriptFailure)

  const documentationGap = records.filter(r => Object.keys(r.findingCategoryCounts).some(k => k.startsWith('Documentation:')))
  if (documentationGap.length >= REPEAT_THRESHOLD) {
    patterns.push({
      category: 'Repeated Documentation Gap',
      description: 'Documentation Intelligence findings recurred across multiple executions.',
      evidence: documentationGap.map(r => r.id),
      frequency: documentationGap.length,
      projectsAffected: [...new Set(documentationGap.map(r => r.projectSlug))],
      confidence: confidenceFromFrequency(documentationGap.length),
    })
  }

  const technicalDebt = patternFromFindingKey(
    records,
    'Technical Debt:Outstanding Debt',
    'Repeated Technical Debt',
    'Outstanding Technical Debt findings recurred across multiple executions.'
  )
  if (technicalDebt) patterns.push(technicalDebt)

  patterns.push(...repeatedRecommendations(records))

  const refactor = repeatedRefactors(records)
  if (refactor) patterns.push(refactor)

  patterns.push(...repeatedBugs(records))

  return patterns
}

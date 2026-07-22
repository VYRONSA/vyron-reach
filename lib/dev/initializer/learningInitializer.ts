import { updateJsonStore } from '../director/fileJsonStore'
import { readDNAProfile, readExecutionRecords, readMemoryEntries } from '../learning/learningStorage'
import type { InitializerStepResult, LearningSubsystemStatus } from './initializerTypes'

/**
 * The seven learning subsystems named in the spec map 1:1 onto existing
 * modules in lib/dev/learning/ (learningEngine, knowledgeEngine,
 * recommendationLearning, executionAnalytics, patternRecognition,
 * decisionMemory, architectureKnowledge). Every one of them is a pure
 * function over already-persisted records — there is no per-subsystem
 * store to create, and nothing here fabricates a first entry for any of
 * them. "Initializing" means confirming each is queryable for this
 * product (which also lazily creates the underlying execution/DNA/
 * memory files via learningStorage.ts's own ensureFile) and recording
 * that confirmation once, so a second run reports it as already done
 * rather than re-confirming from scratch.
 */
const SUBSYSTEMS = [
  'Engineering Learning',
  'Engineering Knowledge',
  'Recommendation Learning',
  'Execution Analytics',
  'Pattern Recognition',
  'Decision Memory',
  'Architecture Knowledge',
] as const

// Wave 4 (Unlocked Stores) remediation — previously read-check-write
// against raw fs with no lock spanning the three steps: two concurrent
// initializeLearning calls for the same productSlug could both pass the
// "not yet initialized" check and both touch every subsystem and write a
// marker. Now the whole check-and-set runs inside fileJsonStore.ts's
// updateJsonStore, under one real file lock — on-disk format (a
// Record<productSlug, initializedAtISOString> object) is unchanged.
const MARKER_FILE = 'learning-initialized.json'

export function learningSubsystemStatuses(productSlug: string): LearningSubsystemStatus[] {
  const executions = readExecutionRecords(productSlug)
  const dna = readDNAProfile(productSlug)
  const memory = readMemoryEntries()

  const counts: Record<string, number> = {
    'Engineering Learning': executions.length,
    'Engineering Knowledge': memory.length,
    'Recommendation Learning': executions.flatMap(e => e.recommendations).length,
    'Execution Analytics': executions.length,
    'Pattern Recognition': 0,
    'Decision Memory': 0,
    'Architecture Knowledge': dna.current.length,
  }

  return SUBSYSTEMS.map(name => ({ name, ready: true, entries: counts[name] ?? 0 }))
}

export function initializeLearning(productSlug: string): InitializerStepResult {
  let result: InitializerStepResult
  updateJsonStore<Record<string, string>>(MARKER_FILE, {}, current => {
    const existing = current[productSlug]
    if (existing) {
      result = { step: 'Learning System', created: [], skipped: [`Already initialized ${existing}`] }
      return current
    }

    // Touches every subsystem's underlying store once, lazily creating the
    // shared execution/DNA/memory files if this is the very first product.
    learningSubsystemStatuses(productSlug)

    result = { step: 'Learning System', created: [...SUBSYSTEMS], skipped: [] }
    return { ...current, [productSlug]: new Date().toISOString() }
  })
  return result!
}

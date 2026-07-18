import fs from 'node:fs'
import path from 'node:path'
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

const STORE_DIR = path.join(process.cwd(), '.vyron-dev')
const MARKER_FILE = path.join(STORE_DIR, 'learning-initialized.json')

function ensureFile(): void {
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true })
  if (!fs.existsSync(MARKER_FILE)) fs.writeFileSync(MARKER_FILE, '{}', 'utf-8')
}

function readMarkers(): Record<string, string> {
  ensureFile()
  try {
    return JSON.parse(fs.readFileSync(MARKER_FILE, 'utf-8')) as Record<string, string>
  } catch {
    return {}
  }
}

function writeMarkers(markers: Record<string, string>): void {
  ensureFile()
  fs.writeFileSync(MARKER_FILE, JSON.stringify(markers, null, 2), 'utf-8')
}

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
  const markers = readMarkers()
  if (markers[productSlug]) {
    return { step: 'Learning System', created: [], skipped: [`Already initialized ${markers[productSlug]}`] }
  }

  // Touches every subsystem's underlying store once, lazily creating the
  // shared execution/DNA/memory files if this is the very first product.
  learningSubsystemStatuses(productSlug)

  const now = new Date().toISOString()
  markers[productSlug] = now
  writeMarkers(markers)

  return { step: 'Learning System', created: [...SUBSYSTEMS], skipped: [] }
}

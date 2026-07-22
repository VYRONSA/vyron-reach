import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { appendAssessmentSnapshot, readAssessmentHistory } from '../../../lib/dev/assessment/assessmentRepository'
import { appendAssessment, listAssessmentHistory } from '../../../lib/dev/director/assessment/assessmentStore'
import {
  ENGINEERING_ASSESSMENT_HISTORY_FILE,
  DIRECTOR_ASSESSMENT_HISTORY_FILE,
  assertAssessmentStoreFilenamesAreDistinct,
} from '../../../lib/dev/assessmentStoreFilenames'
import type { AssessmentSnapshot } from '../../../lib/dev/assessment/assessmentTypes'
import type { EngineeringAssessment } from '../../../lib/dev/director/assessment/assessmentTypes'
import type { AssessmentHistoryEntry } from '../../../lib/dev/director/assessment/assessmentStore'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function makeScoredMetric(score: number) {
  return { score, reasons: [`score ${score}`] }
}

function makeSnapshot(projectSlug: string, overrides: Partial<AssessmentSnapshot> = {}): AssessmentSnapshot {
  return {
    id: `assessment_${projectSlug}_${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    projectSlug,
    scores: {
      engineeringHealth: makeScoredMetric(80),
      maintainability: makeScoredMetric(80),
      architecture: makeScoredMetric(80),
      documentation: makeScoredMetric(80),
      security: makeScoredMetric(80),
      overallConfidence: makeScoredMetric(80),
    },
    recommendations: [],
    buildStatus: 'Passing',
    technicalDebtCount: 0,
    engineeringState: {
      currentPhase: 'Phase 1',
      currentMilestone: 'None set',
      currentBatch: 'None active',
      engineeringOrganization: 'Ready',
      completionPercent: 0,
    },
    ...overrides,
  }
}

function makeDirectorAssessment(project: string, overrides: Partial<EngineeringAssessment> = {}): EngineeringAssessment {
  return {
    project,
    qualityGates: { gates: [], passing: 0, failing: 0, unknown: 0 },
    riskAssessment: { factors: [], overall: 'Low' },
    engineeringHealth: 'Healthy',
    technicalDebtBaseline: 0,
    ...overrides,
  }
}

describe('Assessment store filenames — PRA-P1-003 regression guard', () => {
  it('keeps the Engineering Assessment Engine and Director Assessment Service on distinct filenames', () => {
    expect(ENGINEERING_ASSESSMENT_HISTORY_FILE).not.toBe(DIRECTOR_ASSESSMENT_HISTORY_FILE)
    expect(() => assertAssessmentStoreFilenamesAreDistinct()).not.toThrow()
  })
})

describe('Assessment history stores — no cross-subsystem corruption', () => {
  it('writes each subsystem\'s history to its own file on disk, never a shared one', () => {
    const project = 'reach'
    appendAssessmentSnapshot(makeSnapshot(project))
    appendAssessment(makeDirectorAssessment(project))

    const engineeringFile = path.join(isolated.dir, ENGINEERING_ASSESSMENT_HISTORY_FILE)
    const directorFile = path.join(isolated.dir, DIRECTOR_ASSESSMENT_HISTORY_FILE)

    expect(fs.existsSync(engineeringFile)).toBe(true)
    expect(fs.existsSync(directorFile)).toBe(true)
    expect(engineeringFile).not.toBe(directorFile)

    // Each file parses as exactly its own shape — the collision this
    // finding described would show up here as the wrong subsystem's
    // records (or a shape mismatch) appearing in the other's file.
    const engineeringOnDisk = JSON.parse(fs.readFileSync(engineeringFile, 'utf-8')) as AssessmentSnapshot[]
    const directorOnDisk = JSON.parse(fs.readFileSync(directorFile, 'utf-8')) as AssessmentHistoryEntry[]
    expect(engineeringOnDisk).toHaveLength(1)
    expect(engineeringOnDisk[0].scores).toBeDefined()
    expect(directorOnDisk).toHaveLength(1)
    expect(directorOnDisk[0].assessment.qualityGates).toBeDefined()
  })

  it('reading one subsystem\'s history never returns the other subsystem\'s records', () => {
    const project = 'reach'
    appendAssessmentSnapshot(makeSnapshot(project))
    appendAssessmentSnapshot(makeSnapshot(project))
    appendAssessment(makeDirectorAssessment(project))

    const engineeringHistory = readAssessmentHistory(project)
    const directorHistory = listAssessmentHistory(project)

    expect(engineeringHistory).toHaveLength(2)
    expect(directorHistory).toHaveLength(1)
    // Shape check: an AssessmentSnapshot has `scores`, an AssessmentHistoryEntry has a nested `assessment.qualityGates` — confirms no cross-contamination.
    expect(engineeringHistory.every(s => 'scores' in s)).toBe(true)
    expect(directorHistory.every(e => 'qualityGates' in e.assessment)).toBe(true)
  })

  it('Engineering Assessment snapshots are idempotent on id and respect the VYRON_DEV_DATA_DIR override for test isolation', () => {
    const project = 'core'
    const snapshot = makeSnapshot(project)
    appendAssessmentSnapshot(snapshot)
    appendAssessmentSnapshot(snapshot) // retried request — same id

    expect(readAssessmentHistory(project)).toHaveLength(1)
    // Written under the isolated test directory, never the real repo .vyron-dev.
    expect(fs.existsSync(path.join(isolated.dir, ENGINEERING_ASSESSMENT_HISTORY_FILE))).toBe(true)
  })
})

describe('Assessment snapshot id collisions — PRA-P1-005', () => {
  it('appendAssessmentSnapshot reports whether it actually wrote, distinguishing a genuine write from a no-op replay', () => {
    const project = uniqueSlug()
    const snapshot = makeSnapshot(project)

    expect(appendAssessmentSnapshot(snapshot)).toBe(true)
    expect(appendAssessmentSnapshot(snapshot)).toBe(false) // same id — already recorded, nothing written
    expect(readAssessmentHistory(project)).toHaveLength(1)
  })
})

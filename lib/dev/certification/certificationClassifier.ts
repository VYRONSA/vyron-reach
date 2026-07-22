import { randomUUID } from 'node:crypto'
import type { DashboardEvent } from '../events/eventTypes'
import { certifyFeature } from './certificationPolicy'
import { selectCriteria } from './certificationCriteriaStore'
import type { CertificationCriteria, FeatureCertification } from './certificationTypes'

/**
 * Turns a raw DashboardEvent into feature certification record
 * creation/updates/finalization — pure given (state, event, criteria):
 * no I/O, no wall-clock read, no randomness except a fresh record's id
 * (irrelevant to correctness, only ever compared by value afterward).
 * certificationService.ts is the only caller, inside one persistence
 * lock per event — the exact same shape as metricClassifier.ts's
 * applyEvent from Milestone 2.1.1, deliberately: this codebase now has
 * one proven pattern for "durable state built incrementally from a
 * transient event stream," reused rather than reinvented a third time.
 *
 * "No duplicate metrics" applies here too, as "no duplicate
 * certification": `event.seq` gates reprocessing, and a duplicate/
 * replayed batch-created for a batchId that already has a record is
 * itself a no-op (see the 'batch-created' case) — belt and suspenders
 * against ever creating two Open records for the same feature.
 */
export type CertificationState = {
  lastEventSeq: number
  records: FeatureCertification[]
}

function newFeatureRecord(project: string, batchId: string, batchNumber: string | null, startedAt: string): FeatureCertification {
  return {
    id: randomUUID(),
    project,
    batchId,
    batchNumber,
    status: 'Open',
    startedAt,
    completedAt: null,
    deliveryDurationMs: null,
    planningCompleted: true, // the record only exists because a batch was created — Planning already completed by definition
    architectureCompleted: false,
    knowledgeGathered: false,
    assessmentCompleted: false,
    tasksGenerated: 0,
    tasksCompleted: 0,
    testsExecuted: false,
    documentationGenerated: 0,
    recoveryEvents: 0,
    ceoInterventions: 0,
    manualOverrides: 0,
    result: null,
    criteriaId: null,
  }
}

export function applyEvent(state: CertificationState, event: DashboardEvent, criteria: CertificationCriteria[]): CertificationState {
  if (event.seq <= state.lastEventSeq) return state

  let records = state.records

  const openForBatch = (batchId: string) => records.find(r => r.batchId === batchId && r.status === 'Open') ?? null
  const openForProject = (project: string) => records.filter(r => r.project === project && r.status === 'Open')
  const openEverywhere = () => records.filter(r => r.status === 'Open')
  const patchRecord = (id: string, patch: Partial<FeatureCertification>) => {
    records = records.map(r => (r.id === id ? { ...r, ...patch } : r))
  }

  switch (event.category) {
    case 'Planning Changes': {
      if (event.type === 'batch-created') {
        const payload = event.payload as { batchId: string; batchNumber?: string }
        if (!records.some(r => r.batchId === payload.batchId)) {
          records = [...records, newFeatureRecord(event.project, payload.batchId, payload.batchNumber ?? null, event.timestamp)]
        }
      } else if (event.type === 'batch-completed') {
        const payload = event.payload as { batchId: string }
        const open = openForBatch(payload.batchId)
        if (open) {
          const rawDurationMs = new Date(event.timestamp).getTime() - new Date(open.startedAt).getTime()
          const deliveryDurationMs = rawDurationMs >= 0 ? rawDurationMs : null
          const matched = selectCriteria(open.project, criteria)
          const result = certifyFeature(open, matched)
          patchRecord(open.id, { status: 'Certified', completedAt: event.timestamp, deliveryDurationMs, result, criteriaId: matched?.id ?? null })
        }
      }
      break
    }

    case 'Worker Assignment': {
      const payload = event.payload as { batchId?: string }
      const open = payload.batchId ? openForBatch(payload.batchId) : null
      if (open) patchRecord(open.id, { tasksGenerated: open.tasksGenerated + 1 })
      break
    }

    case 'Worker Completion': {
      const payload = event.payload as { batchId?: string }
      const open = payload.batchId ? openForBatch(payload.batchId) : null
      if (open) patchRecord(open.id, { tasksCompleted: open.tasksCompleted + 1 })
      break
    }

    case 'Knowledge Updates': {
      const payload = event.payload as { timelineCategory?: string; batchId?: string | null }
      const open = payload.batchId ? openForBatch(payload.batchId) : null
      if (open) {
        const patch: Partial<FeatureCertification> = { knowledgeGathered: true }
        if (payload.timelineCategory === 'Architecture Decision') patch.architectureCompleted = true
        if (payload.timelineCategory === 'Handover') patch.documentationGenerated = open.documentationGenerated + 1
        patchRecord(open.id, patch)
      }
      break
    }

    case 'Assessment Updates': {
      // Not batch-scoped in this codebase's data model — credited to
      // every feature currently open for the assessed project (see
      // certificationTypes.ts's FeatureCertification.assessmentCompleted doc).
      for (const open of openForProject(event.project)) patchRecord(open.id, { assessmentCompleted: true })
      break
    }

    case 'Testing': {
      if (event.type === 'test-run-recorded') {
        // Global, not per-project (a whole-suite run) — credited to every open feature everywhere.
        for (const open of openEverywhere()) patchRecord(open.id, { testsExecuted: true })
      }
      break
    }

    case 'Recovery': {
      // Cross-project by the Event Service's own '*' convention — credited to every open feature everywhere.
      for (const open of openEverywhere()) patchRecord(open.id, { recoveryEvents: open.recoveryEvents + 1 })
      break
    }

    case 'Engineering Inbox': {
      if (event.type === 'item-closed') {
        const payload = event.payload as { status?: string }
        for (const open of openForProject(event.project)) {
          patchRecord(open.id, {
            ceoInterventions: open.ceoInterventions + 1,
            manualOverrides: payload.status === 'Dismissed' ? open.manualOverrides + 1 : open.manualOverrides,
          })
        }
      }
      break
    }
  }

  return { lastEventSeq: event.seq, records }
}

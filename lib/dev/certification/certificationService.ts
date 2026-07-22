import { randomUUID } from 'node:crypto'
import { subscribe } from '../events/eventBus'
import { listInboxItems } from '../director/engineeringInboxStore'
import { listKnowledgeRecords, KNOWLEDGE_FILES, type KnowledgeDomain } from '../knowledge/knowledgeStore'
import { listTestRuns } from '../metrics/metricsStore'
import { inDateRange } from '../query/queryHelpers'
import { computeQualityScore } from './certificationPolicy'
import { processCertificationEvent, resetEventCursor, getFeatureCertification, getFeatureCertificationForBatch, listCertifiedFeatures, saveEvidencePack, getEvidencePackForFeature } from './certificationStore'
import type { DecisionRecord, TimelineEvent } from '../knowledge/knowledgeTypes'
import type { EvidencePack, FeatureCertification, PlatformCertificationSummary, PlatformCertificationWindow, ProjectCertificationSummary } from './certificationTypes'

/**
 * The Certification Service's orchestration layer: subscribing to the
 * Event Service (mirrors metricsService.ts's startMetricsSubscription
 * exactly — two independent subscribers, no shared state between them),
 * aggregating Certified features into Project/Platform summaries, and
 * assembling Evidence Packs from durable records other services already
 * own (Knowledge, Inbox, Metrics test runs — reads, not new calculation
 * performed by those services).
 */

function average(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

function aggregate(records: FeatureCertification[]): Omit<ProjectCertificationSummary, 'project'> {
  const total = records.length
  const autonomous = records.filter(r => r.result === 'Certified Autonomous').length
  const assisted = records.filter(r => r.result === 'Certified Assisted').length
  const manual = records.filter(r => r.result === 'Manual Delivery').length
  const durations = records.map(r => r.deliveryDurationMs).filter((v): v is number => v !== null)

  return {
    totalFeatures: total,
    certifiedAutonomous: autonomous,
    certifiedAssisted: assisted,
    manualDelivery: manual,
    automationPercentage: total > 0 ? (autonomous / total) * 100 : null,
    averageInterventionRate: average(records.map(r => r.ceoInterventions + r.manualOverrides)),
    averageDeliveryDurationMs: average(durations),
    averageQualityScore: average(records.map(computeQualityScore)),
    averageRecoveryFrequency: average(records.map(r => r.recoveryEvents)),
  }
}

export function getProjectCertification(project: string): ProjectCertificationSummary {
  return { project, ...aggregate(listCertifiedFeatures(project)) }
}

const WINDOW_MS: Record<PlatformCertificationWindow, number> = {
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
  '12m': 365 * 24 * 60 * 60 * 1000,
}

/** "Maintain rolling platform statistics" — filters every Certified feature platform-wide (across every project) to those completed within the window ending at `now`, then aggregates exactly like a single project's certification. Deterministic given an explicit `now`, never an internal Date.now() read. */
export function getPlatformCertification(window: PlatformCertificationWindow, now: string = new Date().toISOString()): PlatformCertificationSummary {
  const from = new Date(new Date(now).getTime() - WINDOW_MS[window]).toISOString()
  const inWindow = listCertifiedFeatures().filter(r => r.completedAt && inDateRange(r.completedAt, { from, to: now }))
  return { project: '*', window, generatedAt: now, ...aggregate(inWindow) }
}

const DOMAINS: KnowledgeDomain[] = Object.keys(KNOWLEDGE_FILES) as KnowledgeDomain[]

/**
 * "Generate a permanent certification package." Only ever generated for
 * a Certified feature — an Open one has no final certification yet to
 * package. Idempotent: calling this again for the same feature returns
 * the already-saved pack rather than generating (and persisting) a
 * second one, satisfying "duplicate prevention" for evidence the same
 * way certificationClassifier.ts's batchId check does for feature
 * records themselves.
 */
export function generateEvidencePack(featureCertificationId: string): EvidencePack | null {
  const existing = getEvidencePackForFeature(featureCertificationId)
  if (existing) return existing

  const feature = getFeatureCertification(featureCertificationId)
  if (!feature || feature.status !== 'Certified') return null

  const timelineRecords = listKnowledgeRecords<TimelineEvent>('timeline', feature.project).filter(r => r.batchId === feature.batchId)
  const architectureRecords = listKnowledgeRecords<DecisionRecord>('architectureDecisions', feature.project).filter(r => r.batchId === feature.batchId)
  const knowledgeSummary = DOMAINS.map(domain => ({
    domain,
    count: listKnowledgeRecords(domain, feature.project).filter(r => r.batchId === feature.batchId).length,
  })).filter(d => d.count > 0)

  const testRunsInWindow = feature.completedAt
    ? listTestRuns({ dateRange: { from: feature.startedAt, to: feature.completedAt } }, { pageSize: 200 }).items
    : []
  const testingSummary = {
    executed: testRunsInWindow.reduce((sum, r) => sum + r.executed, 0),
    passed: testRunsInWindow.reduce((sum, r) => sum + r.passed, 0),
    failed: testRunsInWindow.reduce((sum, r) => sum + r.failed, 0),
    runs: testRunsInWindow.length,
  }

  const resolvedItems = listInboxItems({ project: feature.project })
    .filter(i => i.batchId === feature.batchId && i.status !== 'Open')
    .map(i => ({ reason: i.reason, resolutionNote: i.resolutionNote, timestamp: i.timestamp }))

  const pack: EvidencePack = {
    id: randomUUID(),
    featureCertificationId: feature.id,
    project: feature.project,
    batchId: feature.batchId,
    generatedAt: new Date().toISOString(),
    finalCertification: feature.result,
    automationScore: computeQualityScore(feature),
    timeline: timelineRecords.map(t => ({ timestamp: t.timestamp, category: t.category, title: t.title, detail: t.detail })),
    metrics: { tasksGenerated: feature.tasksGenerated, tasksCompleted: feature.tasksCompleted, deliveryDurationMs: feature.deliveryDurationMs },
    recoveryHistory: { recoveryEvents: feature.recoveryEvents },
    testingSummary,
    architectureSummary: architectureRecords.map(a => ({ decision: a.decision, reason: a.reason, timestamp: a.timestamp })),
    knowledgeSummary,
    ceoInvolvement: { ceoInterventions: feature.ceoInterventions, manualOverrides: feature.manualOverrides, resolvedItems },
  }

  saveEvidencePack(pack)
  return pack
}

let unsubscribe: (() => void) | null = null

/**
 * Idempotent within a process, defense in depth alongside
 * certificationBootstrap.ts's own singleton guard — same shape as
 * metricsService.ts's startMetricsSubscription, including resetting the
 * persisted dedup cursor first (see certificationStore.ts's
 * resetEventCursor doc comment for why this process's fresh eventBus
 * seq numbering requires it).
 */
export function startCertificationSubscription(): void {
  if (unsubscribe) return
  resetEventCursor()
  unsubscribe = subscribe(event => {
    processCertificationEvent(event)
    // "Generate a permanent certification package" — automatic the
    // instant a feature finishes certifying, not something an operator
    // has to remember to request. generateEvidencePack is idempotent
    // (see its own doc comment), so this is safe even if something else
    // also calls it for the same feature later.
    if (event.category === 'Planning Changes' && event.type === 'batch-completed') {
      const batchId = (event.payload as { batchId?: string }).batchId
      const feature = batchId ? getFeatureCertificationForBatch(batchId) : null
      if (feature && feature.status === 'Certified') {
        try {
          generateEvidencePack(feature.id)
        } catch {
          // Evidence generation reads several other stores; a transient
          // failure here must never break certification processing
          // itself — the feature is already correctly certified either way.
        }
      }
    }
  })
}

export function stopCertificationSubscription(): void {
  unsubscribe?.()
  unsubscribe = null
}

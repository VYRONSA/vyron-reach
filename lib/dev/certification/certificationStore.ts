import { readJsonStore, updateJsonStore } from '../director/fileJsonStore'
import { paginate, inDateRange } from '../query/queryHelpers'
import type { PageRequest, PageResult, DateRangeFilter } from '../query/queryTypes'
import type { DashboardEvent } from '../events/eventTypes'
import { applyEvent, type CertificationState } from './certificationClassifier'
import { listCertificationCriteria } from './certificationCriteriaStore'
import type { CertificationResult, EvidencePack, FeatureCertification, FeatureCertificationStatus } from './certificationTypes'

const STATE_FILE = 'certification-state.json'
const EVIDENCE_FILE = 'certification-evidence-packs.json'

const DEFAULT_STATE: CertificationState = { lastEventSeq: 0, records: [] }

export function getCertificationState(): CertificationState {
  return readJsonStore<CertificationState>(STATE_FILE, DEFAULT_STATE)
}

/**
 * The Certification Service's single write path — the entire read-
 * classify-write cycle (including reading the current criteria to decide
 * a just-completed feature's result) happens inside one updateJsonStore
 * lock, the same concurrency-safe shape metricsStore.ts's
 * processMetricEvent established in Milestone 2.1.1.
 */
export function processCertificationEvent(event: DashboardEvent): CertificationState {
  const criteria = listCertificationCriteria()
  return updateJsonStore<CertificationState>(STATE_FILE, DEFAULT_STATE, current => applyEvent(current, event, criteria))
}

/**
 * eventBus.ts's own doc comment is explicit: `seq` "resets to 0 on every
 * process restart — meaningless across restarts." lastEventSeq exists to
 * make redelivery WITHIN one live process's subscription a safe no-op,
 * never to compare seq numbers minted by a previous process.
 * certificationBootstrap.ts (via certificationService.ts's
 * startCertificationSubscription) calls this once, immediately before
 * subscribing, so the persisted cursor is back in sync with the fresh
 * eventBus instance it's about to start reading from — every
 * FeatureCertification record accumulated so far is untouched, only the
 * dedup cursor resets. See metricsStore.ts's identical resetEventCursor
 * from Milestone 2.1.1 — the same fix, for the same underlying reason.
 */
export function resetEventCursor(): void {
  updateJsonStore<CertificationState>(STATE_FILE, DEFAULT_STATE, current => ({ ...current, lastEventSeq: 0 }))
}

export function getFeatureCertification(id: string): FeatureCertification | null {
  return getCertificationState().records.find(r => r.id === id) ?? null
}

export function getFeatureCertificationForBatch(batchId: string): FeatureCertification | null {
  return getCertificationState().records.find(r => r.batchId === batchId) ?? null
}

export function listOpenFeatures(project?: string): FeatureCertification[] {
  const records = getCertificationState().records.filter(r => r.status === 'Open')
  return project ? records.filter(r => r.project === project) : records
}

export type FeatureCertificationQueryFilter = {
  project?: string
  status?: FeatureCertificationStatus
  result?: CertificationResult
  dateRange?: DateRangeFilter
}

export function queryFeatureCertifications(filter: FeatureCertificationQueryFilter = {}, page: PageRequest = {}): PageResult<FeatureCertification> {
  let items = getCertificationState().records
  if (filter.project) items = items.filter(r => r.project === filter.project)
  if (filter.status) items = items.filter(r => r.status === filter.status)
  if (filter.result) items = items.filter(r => r.result === filter.result)
  if (filter.dateRange) items = items.filter(r => inDateRange(r.startedAt, filter.dateRange))
  // Newest first — matches every other historical listing in this app.
  items = [...items].sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  return paginate(items, page)
}

/** Every Certified feature, regardless of pagination — the raw input Project/Platform Certification aggregation (certificationService.ts) and full-history export both need the complete set, not one page of it. */
export function listCertifiedFeatures(project?: string): FeatureCertification[] {
  const records = getCertificationState().records.filter(r => r.status === 'Certified')
  return project ? records.filter(r => r.project === project) : records
}

/** "Generate a permanent certification package." Append-only, never archived — the same "permanent record" treatment knowledgeStore.ts's domains already established for evidence that must survive indefinitely. */
export function saveEvidencePack(pack: EvidencePack): void {
  updateJsonStore<EvidencePack[]>(EVIDENCE_FILE, [], current => [pack, ...current])
}

export function getEvidencePack(id: string): EvidencePack | null {
  return readJsonStore<EvidencePack[]>(EVIDENCE_FILE, []).find(p => p.id === id) ?? null
}

export function getEvidencePackForFeature(featureCertificationId: string): EvidencePack | null {
  return readJsonStore<EvidencePack[]>(EVIDENCE_FILE, []).find(p => p.featureCertificationId === featureCertificationId) ?? null
}

export function listEvidencePacks(page: PageRequest = {}): PageResult<EvidencePack> {
  return paginate(readJsonStore<EvidencePack[]>(EVIDENCE_FILE, []), page)
}

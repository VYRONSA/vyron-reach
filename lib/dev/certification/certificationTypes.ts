/**
 * Production Validation 2.1, Milestone 2.1.2 — Autonomous Delivery
 * Certification. Types only. "The Certification Service owns all
 * certification logic. Existing services remain unchanged. Existing
 * services only publish events." — the Certification Service is a second,
 * independent subscriber to the same Event Service the Metrics Service
 * (Milestone 2.1.1) already consumes; the two never depend on each
 * other's internal state, each deriving its own facts from the same raw
 * event stream.
 *
 * A "Feature" is this codebase's existing Batch — the smallest unit of
 * planned, independently-deliverable engineering work already tracked
 * throughout Planning/Knowledge/Workforce. Certification does not invent
 * a new unit of work; it certifies the one that already exists.
 */

export type CertificationResult = 'Certified Autonomous' | 'Certified Assisted' | 'Manual Delivery'

/**
 * "Certification criteria must be configuration-driven." Every threshold
 * below is data, not code — certifyFeature() (certificationService.ts) is
 * the one pure function that reads a criteria record and a feature's
 * tallies and decides a result; changing a number here changes future
 * certifications without touching that function.
 */
export type CertificationCriteria = {
  id: string
  name: string
  enabled: boolean
  /** Optional match scope — null means "the default, applies to any project," mirroring escalationRulesStore.ts's identical null-means-wildcard convention. */
  project: string | null
  /** At or below this many combined CEO interventions + manual overrides, a feature qualifies for Certified Autonomous. */
  maxInterventionsForAutonomous: number
  /** Above maxInterventionsForAutonomous but at or below this, a feature qualifies for Certified Assisted instead of Manual Delivery. */
  maxInterventionsForAssisted: number
  /** A feature with zero completed tasks was never actually executed — always Manual Delivery regardless of intervention counts. */
  requireAtLeastOneCompletedTask: boolean
  /** If true, Recovery events during the feature's lifecycle disqualify it from Certified Autonomous (it can still reach Certified Assisted). */
  recoveryDisqualifiesAutonomous: boolean
  createdAt: string
  updatedAt: string
}

/**
 * PRA-P1-030 remediation — certification criteria decide future
 * certifications the same way a risk-gate/executive-control decision
 * decides a release, so a change here gets the same append-only,
 * attributed audit trail those decisions already have (see
 * RiskGateDecision, ExecutiveControlDecision, ReleaseControlDecision):
 * who changed it, when, and the full prior record — never overwritten.
 */
export type CertificationCriteriaChangeType = 'Updated' | 'Deleted'

export type CertificationCriteriaChange = {
  id: string
  criteriaId: string
  changeType: CertificationCriteriaChangeType
  changedBy: string
  changedAt: string
  /** The full record as it stood immediately before this change. */
  previous: CertificationCriteria
}

export type FeatureCertificationStatus = 'Open' | 'Certified'

/**
 * One feature's (batch's) certification record — created the moment a
 * batch-created event is observed, updated as correlated events arrive
 * while it stays Open, finalized (result assigned, status -> Certified)
 * the moment its matching batch-completed event arrives. Every count
 * here is a tally of raw events observed for this specific batchId (or,
 * for signals with no batch-level granularity in this codebase —
 * Assessment, Testing, Recovery — a coarse "did this happen while the
 * feature was open" signal, documented at each field).
 */
export type FeatureCertification = {
  id: string
  project: string
  batchId: string
  batchNumber: string | null
  status: FeatureCertificationStatus
  startedAt: string
  completedAt: string | null
  deliveryDurationMs: number | null

  planningCompleted: boolean
  /** True once an Architecture Decision (Knowledge Service) was recorded for this batchId while the feature was open. */
  architectureCompleted: boolean
  /** True once any Knowledge Updates event correlated to this batchId was observed. */
  knowledgeGathered: boolean
  /** Coarse project+open-window signal — Assessment Updates events aren't batch-scoped in this codebase's data model (see this file's header doc). */
  assessmentCompleted: boolean
  tasksGenerated: number
  tasksCompleted: number
  /** Coarse global+open-window signal — test runs aren't per-feature (see metricsTypes.ts's TestRunInput doc from Milestone 2.1.1). */
  testsExecuted: boolean
  documentationGenerated: number
  /** Coarse global+open-window signal — Recovery events are cross-project by the Event Service's own '*' convention. */
  recoveryEvents: number
  ceoInterventions: number
  manualOverrides: number

  result: CertificationResult | null
  criteriaId: string | null
}

export type ProjectCertificationSummary = {
  project: string
  totalFeatures: number
  certifiedAutonomous: number
  certifiedAssisted: number
  manualDelivery: number
  automationPercentage: number | null
  averageInterventionRate: number | null
  averageDeliveryDurationMs: number | null
  averageQualityScore: number | null
  averageRecoveryFrequency: number | null
}

export type PlatformCertificationWindow = '30d' | '90d' | '12m'

export type PlatformCertificationSummary = ProjectCertificationSummary & {
  window: PlatformCertificationWindow
  generatedAt: string
}

/** "Generate a permanent certification package." Assembled from durable records already owned by other services (Knowledge, Inbox, Metrics test runs) — reads, never new calculation performed by those services. */
export type EvidencePack = {
  id: string
  featureCertificationId: string
  project: string
  batchId: string
  generatedAt: string
  finalCertification: CertificationResult | null
  automationScore: number
  timeline: { timestamp: string; category: string; title: string; detail: string }[]
  metrics: {
    tasksGenerated: number
    tasksCompleted: number
    deliveryDurationMs: number | null
  }
  recoveryHistory: { recoveryEvents: number }
  testingSummary: { executed: number; passed: number; failed: number; runs: number }
  architectureSummary: { decision: string; reason: string; timestamp: string }[]
  knowledgeSummary: { domain: string; count: number }[]
  ceoInvolvement: { ceoInterventions: number; manualOverrides: number; resolvedItems: { reason: string; resolutionNote: string | null; timestamp: string }[] }
}

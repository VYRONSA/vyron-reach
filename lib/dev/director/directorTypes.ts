import type { EngineeringFinding, FindingSeverity } from '../intelligence/types'
import type { EngineeringHealth } from '../intelligence/engineeringIntelligenceEngine'

export type DeliveryConfidence = 'High' | 'Medium' | 'Low'
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'
export type ArchitectureHealth = EngineeringHealth

/** A finding whose priority the Director is recommending change from what the Engineering Intelligence Engine originally assigned — never a new finding, only a re-ranking of one that already exists. */
export type PriorityChange = {
  finding: EngineeringFinding
  originalPriority: FindingSeverity
  recommendedPriority: FindingSeverity
  reason: string
}

export type DeferredWorkItem = {
  finding: EngineeringFinding
  reason: string
}

export type AcceleratedWorkItem = {
  finding: EngineeringFinding
  reason: string
}

export type SprintItem = {
  title: string
  source: string
  href: string
  priority: FindingSeverity
}

/**
 * The Director's output. Every field traces back to Engineering
 * Intelligence findings, the Executive Action Queue, or the Dependency
 * Engine — nothing here is a new fact. Health/risk/confidence fields are
 * deterministic labels derived from counts and severities already present
 * in those inputs, the same style of aggregation the Executive
 * Intelligence layer already uses for Engineering Score/Health.
 */
export type ExecutiveEngineeringStrategy = {
  currentStrategicGoal: string
  currentDevelopmentTheme: string
  currentProductFocus: string
  deliveryConfidence: DeliveryConfidence
  architectureHealth: ArchitectureHealth
  productRisk: RiskLevel
  technicalRisk: RiskLevel
  commercialRisk: RiskLevel
  recommendedPriorityChanges: PriorityChange[]
  recommendedDeferredWork: DeferredWorkItem[]
  recommendedAcceleratedWork: AcceleratedWorkItem[]
  recommendedNextSprint: SprintItem[]
  overallRecommendation: string
  /** The single evidence-backed finding behind currentStrategicGoal — what the Planning Engine's "Executive Strategy" priority tier actually selects on, when the Director has escalated something. */
  topPriorityFinding: EngineeringFinding | null
}

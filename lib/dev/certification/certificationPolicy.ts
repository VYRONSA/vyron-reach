import type { CertificationCriteria, CertificationResult, FeatureCertification } from './certificationTypes'

/**
 * The deterministic certification decision — a pure function of a
 * feature's tallies and a CertificationCriteria record. "Certification
 * criteria must be configuration-driven": every threshold this function
 * reads comes from `criteria`, never a literal here, so changing the
 * criteria record changes future certifications without touching this
 * function.
 */
export function certifyFeature(record: Pick<FeatureCertification, 'tasksCompleted' | 'ceoInterventions' | 'manualOverrides' | 'recoveryEvents'>, criteria: CertificationCriteria | null): CertificationResult {
  // No matching/enabled criteria — never guess a result; the caller
  // (certificationClassifier.ts) leaves criteriaId null in this case, so
  // "no criteria configured" is honestly represented rather than silently
  // defaulting to an arbitrary tier.
  if (!criteria) return 'Manual Delivery'

  if (criteria.requireAtLeastOneCompletedTask && record.tasksCompleted === 0) return 'Manual Delivery'

  const interventions = record.ceoInterventions + record.manualOverrides
  const recoveryBlocksAutonomous = criteria.recoveryDisqualifiesAutonomous && record.recoveryEvents > 0

  if (interventions <= criteria.maxInterventionsForAutonomous && !recoveryBlocksAutonomous) return 'Certified Autonomous'
  if (interventions <= criteria.maxInterventionsForAssisted) return 'Certified Assisted'
  return 'Manual Delivery'
}

/** A 0–100 composite of every non-numeric completion signal — "Average quality score" (Project/Platform Certification) is the average of this across a set of features, computed in certificationService.ts; this function only ever scores one feature. */
export function computeQualityScore(record: Pick<FeatureCertification, 'planningCompleted' | 'architectureCompleted' | 'knowledgeGathered' | 'assessmentCompleted' | 'testsExecuted' | 'documentationGenerated'>): number {
  const signals = [
    record.planningCompleted,
    record.architectureCompleted,
    record.knowledgeGathered,
    record.assessmentCompleted,
    record.testsExecuted,
    record.documentationGenerated > 0,
  ]
  const achieved = signals.filter(Boolean).length
  return (achieved / signals.length) * 100
}

/**
 * Shared types for the Engineering Organization Initializer. Every
 * "created X" count below reflects records the initializer actually
 * wrote this run — records skipped because they already existed are
 * counted separately, never folded into "created" (that distinction is
 * what makes a second run's audit trail honest about doing nothing).
 */

export type EngineeringPhaseDefinition = {
  number: number
  name: string
}

export type MilestoneTemplate = {
  title: string
  phaseNumber: number
  /** Explicit position in the canonical Engineering Sequence — the only thing current-position selection is allowed to sort by. */
  sequence: number
}

/** One step's outcome (Roadmap, Milestones, Batches, Queue, Learning, DNA). */
export type InitializerStepResult = {
  step: string
  created: string[]
  skipped: string[]
}

export type EngineeringOrganizationAudit = {
  projectSlug: string
  initializedBy: string
  startedAt: string
  completedAt: string
  durationMs: number
  steps: InitializerStepResult[]
}

export type EngineeringOrganizationState = {
  projectSlug: string
  engineeringReady: boolean
  initializedAt: string | null
  initializedBy: string | null
  lastAudit: EngineeringOrganizationAudit | null
  auditHistory: EngineeringOrganizationAudit[]
}

export type DNAProfileFields = {
  productSlug: string
  productName: string
  category: string
  technologyStack: string
  architectureStyle: string
  knownIntegrations: string
  businessDomain: string
  currentVersion: string
  dnaVersion: number
  createdAt: string
}

export type LearningSubsystemStatus = {
  name: string
  ready: boolean
  entries: number
}

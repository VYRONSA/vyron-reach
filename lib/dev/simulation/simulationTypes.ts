/**
 * Production Validation 2.1, Milestone 2.1.3 — Engineering Simulation &
 * Stress Validation. Types only.
 */

export type ScenarioId =
  | 'single-feature'
  | 'multiple-features'
  | 'single-project'
  | 'multiple-projects'
  | 'concurrent-projects'
  | 'blocked-project'
  | 'ceo-approval-delay'
  | 'recovery-during-execution'
  | 'worker-failure'
  | 'notification-failure'
  | 'escalation-chain'
  | 'long-running-project'
  | 'large-knowledge-base'
  | 'large-planning-set'

export type LoadProfileLabel = 'Small' | 'Medium' | 'Large' | 'Enterprise' | 'Custom'

/** The concrete quantities a load profile expands to — every scenario is defined once, at Small scale, and the load profile is a multiplier on top (see simulationScenarios.ts). */
export type LoadProfileConfig = {
  projects: number
  featuresPerProject: number
  tasksPerFeature: number
  knowledgeRecordsPerFeature: number
}

export type FaultType =
  | 'process-restart'
  | 'worker-crash'
  | 'notification-provider-failure'
  | 'escalation-interruption'
  | 'scheduler-interruption'
  | 'knowledge-refresh-interruption'
  | 'recovery-interruption'

/** "Fault timing must be reproducible" — expressed as a step number in the simulation's own deterministic action sequence, never a wall-clock delay. The Nth fault configured fires the Nth time the runner's step counter reaches `afterStep`. */
export type FaultInjection = {
  type: FaultType
  afterStep: number
}

export type SimulationConfig = {
  id: string
  scenario: ScenarioId
  loadProfile: LoadProfileLabel
  /** Required when loadProfile is 'Custom'; ignored (the preset is used) otherwise. */
  customLoad?: LoadProfileConfig
  /** Deterministic PRNG seed — the same scenario+loadProfile+seed+faults always produces the same timeline, measurements, and certification outcome ("Deterministic replay" from Validation). */
  seed: number
  faults: FaultInjection[]
  createdAt: string
}

export type SimulationTimelineEntry = {
  step: number
  timestamp: string
  type: string
  detail: string
}

export type SimulationFailureEntry = {
  step: number
  timestamp: string
  faultType: FaultType
  detail: string
}

export type SimulationRecoveryEntry = {
  step: number
  timestamp: string
  faultType: FaultType
  detail: string
  durationMs: number
}

export type SimulationMeasurements = {
  completionRate: number | null
  recoveryRate: number | null
  failureRate: number | null
  /** Certified/completed features per simulated project — a load-normalized throughput signal (real elapsed wall-clock time is not a meaningful "duration" for a simulation that runs in milliseconds, see simulationRunner.ts's header doc). */
  averageThroughput: number | null
  averageInterventionRate: number | null
  automationPercentage: number | null
  averageRecoveryDurationMs: number | null
  /** Peak Waiting count observed across every Scheduler cycle run during the simulation, minus the first cycle's — how much backlog built up under load. */
  queueGrowth: number
  /** Completed tasks / tasks generated — how much of the assigned work a worker actually finished. */
  workerUtilisation: number | null
  /** Cycles that started or resumed at least one project / total cycles run — how often the Scheduler actually had useful work to do. */
  schedulerUtilisation: number | null
}

export type CertificationOutcomeTally = {
  certifiedAutonomous: number
  certifiedAssisted: number
  manualDelivery: number
}

export type SimulationStatus = 'Running' | 'Completed' | 'Failed'

/** "Generate permanent reports." Persisted forever (simulationStore.ts), never archived — a stress-test result is exactly the kind of evidence Milestone 2.1.2's Evidence Packs already established this app keeps permanently. */
export type SimulationReport = {
  id: string
  status: SimulationStatus
  scenario: ScenarioId
  configuration: SimulationConfig
  startedAt: string
  completedAt: string | null
  timeline: SimulationTimelineEntry[]
  measurements: SimulationMeasurements
  failures: SimulationFailureEntry[]
  recoveries: SimulationRecoveryEntry[]
  certificationOutcome: CertificationOutcomeTally | null
  /** "Final engineering summary" — a short, human-readable narrative built from the measurements above, not a separate calculation. */
  summary: string
  error: string | null
}

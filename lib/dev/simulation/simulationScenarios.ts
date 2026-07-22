import type { FaultInjection, LoadProfileConfig, LoadProfileLabel, ScenarioId } from './simulationTypes'

/**
 * Every scenario is defined once, at Small scale, as a set of behavioral
 * knobs (how often a task fails, whether the CEO delays approval,
 * whether a project starts Blocked, ...) — the load profile then scales
 * quantity, not behavior, so "Worker Failure at Enterprise scale" is a
 * meaningful, well-defined combination rather than a 15th bespoke
 * scenario implementation. simulationRunner.ts is the one place that
 * turns a ScenarioDefinition + resolved load into actual real service
 * calls.
 *
 * Base quantities are deliberately small: every feature here drives
 * ~8-12 real, synchronous, file-locked service calls (create/complete a
 * batch, assign/complete a task, record knowledge, a notification
 * delivery, ...), and an empirical timing pass in this environment
 * measured roughly 0.5-0.6s per feature end to end. These numbers are
 * calibrated so Small completes in a couple of seconds and even
 * Enterprise stays under ~20s for every scenario — a simulation is meant
 * to be triggered from a dashboard button and returned synchronously,
 * not modeled as a literal thousand-feature portfolio.
 */
export type ScenarioDefinition = {
  base: LoadProfileConfig
  workerFailureRate: number
  ceoInterventionRate: number
  ceoDismissRate: number
  blockFirstProject: boolean
  notificationFailureRate: number
  escalationChain: boolean
  concurrentProjects: boolean
  defaultFaults: FaultInjection[]
}

const SCENARIOS: Record<ScenarioId, ScenarioDefinition> = {
  'single-feature': {
    base: { projects: 1, featuresPerProject: 1, tasksPerFeature: 1, knowledgeRecordsPerFeature: 1 },
    workerFailureRate: 0,
    ceoInterventionRate: 0,
    ceoDismissRate: 0,
    blockFirstProject: false,
    notificationFailureRate: 0,
    escalationChain: false,
    concurrentProjects: false,
    defaultFaults: [],
  },
  'multiple-features': {
    base: { projects: 1, featuresPerProject: 4, tasksPerFeature: 1, knowledgeRecordsPerFeature: 1 },
    workerFailureRate: 0,
    ceoInterventionRate: 0.1,
    ceoDismissRate: 0,
    blockFirstProject: false,
    notificationFailureRate: 0,
    escalationChain: false,
    concurrentProjects: false,
    defaultFaults: [],
  },
  'single-project': {
    base: { projects: 1, featuresPerProject: 3, tasksPerFeature: 1, knowledgeRecordsPerFeature: 1 },
    workerFailureRate: 0.1,
    ceoInterventionRate: 0.2,
    ceoDismissRate: 0.1,
    blockFirstProject: false,
    notificationFailureRate: 0.05,
    escalationChain: false,
    concurrentProjects: false,
    defaultFaults: [],
  },
  'multiple-projects': {
    base: { projects: 3, featuresPerProject: 2, tasksPerFeature: 1, knowledgeRecordsPerFeature: 1 },
    workerFailureRate: 0.1,
    ceoInterventionRate: 0.15,
    ceoDismissRate: 0.05,
    blockFirstProject: false,
    notificationFailureRate: 0.05,
    escalationChain: false,
    concurrentProjects: false,
    defaultFaults: [],
  },
  'concurrent-projects': {
    base: { projects: 3, featuresPerProject: 1, tasksPerFeature: 1, knowledgeRecordsPerFeature: 1 },
    workerFailureRate: 0.1,
    ceoInterventionRate: 0.1,
    ceoDismissRate: 0.05,
    blockFirstProject: false,
    notificationFailureRate: 0.05,
    escalationChain: false,
    concurrentProjects: true,
    defaultFaults: [{ type: 'scheduler-interruption', afterStep: 4 }],
  },
  'blocked-project': {
    base: { projects: 2, featuresPerProject: 1, tasksPerFeature: 1, knowledgeRecordsPerFeature: 1 },
    workerFailureRate: 0,
    ceoInterventionRate: 0.1,
    ceoDismissRate: 0,
    blockFirstProject: true,
    notificationFailureRate: 0,
    escalationChain: false,
    concurrentProjects: false,
    defaultFaults: [],
  },
  'ceo-approval-delay': {
    base: { projects: 1, featuresPerProject: 3, tasksPerFeature: 1, knowledgeRecordsPerFeature: 1 },
    workerFailureRate: 0,
    ceoInterventionRate: 0.75,
    ceoDismissRate: 0.1,
    blockFirstProject: false,
    notificationFailureRate: 0,
    escalationChain: false,
    concurrentProjects: false,
    defaultFaults: [],
  },
  'recovery-during-execution': {
    base: { projects: 2, featuresPerProject: 2, tasksPerFeature: 1, knowledgeRecordsPerFeature: 1 },
    workerFailureRate: 0.1,
    ceoInterventionRate: 0.1,
    ceoDismissRate: 0,
    blockFirstProject: false,
    notificationFailureRate: 0,
    escalationChain: false,
    concurrentProjects: false,
    defaultFaults: [{ type: 'process-restart', afterStep: 3 }],
  },
  'worker-failure': {
    base: { projects: 1, featuresPerProject: 4, tasksPerFeature: 1, knowledgeRecordsPerFeature: 1 },
    workerFailureRate: 0.4,
    ceoInterventionRate: 0.2,
    ceoDismissRate: 0.1,
    blockFirstProject: false,
    notificationFailureRate: 0,
    escalationChain: false,
    concurrentProjects: false,
    defaultFaults: [{ type: 'worker-crash', afterStep: 2 }],
  },
  'notification-failure': {
    base: { projects: 1, featuresPerProject: 3, tasksPerFeature: 1, knowledgeRecordsPerFeature: 1 },
    workerFailureRate: 0,
    ceoInterventionRate: 0.1,
    ceoDismissRate: 0,
    blockFirstProject: false,
    notificationFailureRate: 0.5,
    escalationChain: false,
    concurrentProjects: false,
    defaultFaults: [{ type: 'notification-provider-failure', afterStep: 2 }],
  },
  'escalation-chain': {
    base: { projects: 1, featuresPerProject: 2, tasksPerFeature: 1, knowledgeRecordsPerFeature: 1 },
    workerFailureRate: 0.2,
    ceoInterventionRate: 0,
    ceoDismissRate: 0,
    blockFirstProject: false,
    notificationFailureRate: 0,
    escalationChain: true,
    concurrentProjects: false,
    defaultFaults: [{ type: 'escalation-interruption', afterStep: 3 }],
  },
  'long-running-project': {
    base: { projects: 1, featuresPerProject: 8, tasksPerFeature: 1, knowledgeRecordsPerFeature: 1 },
    workerFailureRate: 0.05,
    ceoInterventionRate: 0.1,
    ceoDismissRate: 0.02,
    blockFirstProject: false,
    notificationFailureRate: 0.02,
    escalationChain: false,
    concurrentProjects: false,
    defaultFaults: [{ type: 'recovery-interruption', afterStep: 10 }],
  },
  'large-knowledge-base': {
    base: { projects: 1, featuresPerProject: 3, tasksPerFeature: 1, knowledgeRecordsPerFeature: 5 },
    workerFailureRate: 0,
    ceoInterventionRate: 0,
    ceoDismissRate: 0,
    blockFirstProject: false,
    notificationFailureRate: 0,
    escalationChain: false,
    concurrentProjects: false,
    defaultFaults: [{ type: 'knowledge-refresh-interruption', afterStep: 4 }],
  },
  'large-planning-set': {
    base: { projects: 2, featuresPerProject: 3, tasksPerFeature: 1, knowledgeRecordsPerFeature: 1 },
    workerFailureRate: 0.05,
    ceoInterventionRate: 0.05,
    ceoDismissRate: 0,
    blockFirstProject: false,
    notificationFailureRate: 0,
    escalationChain: false,
    concurrentProjects: true,
    defaultFaults: [],
  },
}

export const SCENARIO_IDS = Object.keys(SCENARIOS) as ScenarioId[]

export function getScenarioDefinition(scenario: ScenarioId): ScenarioDefinition {
  return SCENARIOS[scenario]
}

/** Small=1x (the scenario's own base numbers) up through Enterprise=4x — capped deliberately low, see this file's header doc. Only feature/knowledge volume scales with load; project count and tasks-per-feature stay scenario-defined, since those are behavioral choices (e.g. "multiple projects," "concurrent projects"), not raw load. */
const LOAD_MULTIPLIERS: Record<Exclude<LoadProfileLabel, 'Custom'>, number> = { Small: 1, Medium: 2, Large: 3, Enterprise: 4 }

export function resolveLoad(scenario: ScenarioId, profile: LoadProfileLabel, custom?: LoadProfileConfig): LoadProfileConfig {
  if (profile === 'Custom') return custom ?? getScenarioDefinition(scenario).base
  const multiplier = LOAD_MULTIPLIERS[profile]
  const base = getScenarioDefinition(scenario).base
  return {
    projects: base.projects,
    featuresPerProject: Math.max(1, Math.round(base.featuresPerProject * multiplier)),
    tasksPerFeature: base.tasksPerFeature,
    knowledgeRecordsPerFeature: Math.max(1, Math.round(base.knowledgeRecordsPerFeature * multiplier)),
  }
}

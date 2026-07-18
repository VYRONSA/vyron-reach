/**
 * Shared types for the Engineering Knowledge, Learning & DNA Engine.
 * Every array here starts empty and stays empty until real executions
 * produce evidence for it — nothing in this module seeds example content.
 * The elaborate per-product examples in this batch's own spec (payroll
 * rules, SARS integration, etc.) describe what Engineering DNA *would*
 * eventually contain once VYRON PAY has real successful executions behind
 * it, not data to invent today.
 */

export type ExecutionOutcome = 'Succeeded' | 'Failed' | 'RolledBack' | 'Rejected' | 'Unknown'

/**
 * One execution's full learning record — derived by joining an already-
 * persisted DevelopmentJob with its already-persisted Handover and the
 * Workforce decisions that were live at execution time, not a new,
 * independently-authored record. This is the single source every other
 * file in this module reads from.
 */
export type ExecutionLearningRecord = {
  id: string
  timestamp: string
  projectSlug: string
  product: string
  phase: string
  milestone: string | null
  batch: string | null
  taskTitle: string | null
  objective: string
  runtime: string
  cost: number | null
  durationMs: number | null
  filesCreated: string[]
  filesModified: string[]
  findingCategoryCounts: Record<string, number>
  directorGoal: string | null
  directorTheme: string | null
  agentsUsed: string[]
  agentDecisions: { role: string; decision: string; confidence: string; durationMs: number; cost: number }[]
  recommendations: string[]
  outcome: ExecutionOutcome
}

export type PatternConfidence = 'High' | 'Medium' | 'Low'

export type EngineeringPattern = {
  category:
    | 'Repeated Bug'
    | 'Repeated Recommendation'
    | 'Repeated Refactor'
    | 'Repeated Architecture Violation'
    | 'Repeated Security Finding'
    | 'Repeated Build Failure'
    | 'Repeated TypeScript Failure'
    | 'Repeated Deployment Failure'
    | 'Repeated Documentation Gap'
    | 'Repeated Technical Debt'
  description: string
  evidence: string[]
  frequency: number
  projectsAffected: string[]
  confidence: PatternConfidence
}

export type DecisionTopic = 'Architecture' | 'Performance' | 'Security' | 'Database' | 'AI' | 'General'

export type DecisionMemoryEntry = {
  decisionId: string
  topic: DecisionTopic
  decision: string
  reason: string
  alternatives: string
  status: string
  project: string
  successful: boolean | null
}

export type EngineeringMemoryEntry = {
  id: string
  topic: string
  summary: string
  evidenceExecutionIds: string[]
  source: 'Learned' | 'Knowledge Base'
  createdAt: string
}

export type RecommendationOutcome = 'Accepted' | 'Rejected' | 'Overridden' | 'Unknown'

export type RecommendationRecord = {
  text: string
  madeAt: string
  project: string
  outcome: RecommendationOutcome
}

export type AgentScorecard = {
  role: string
  executions: number
  acceptedPercent: number | null
  rejectedPercent: number | null
  averageConfidence: string
  predictionAccuracy: number | null
  falsePositives: number
  falseNegatives: number
  averageRuntimeMs: number | null
  averageCost: number | null
  successRate: number | null
}

export type ArchitectureKnowledgeCategory =
  | 'Pattern'
  | 'Reusable Service'
  | 'Reusable Component'
  | 'Reusable SQL'
  | 'Reusable Prompt'
  | 'Reusable Workflow'
  | 'Best Practice'
  | 'Anti-Pattern'

export type ArchitectureKnowledgeEntry = {
  category: ArchitectureKnowledgeCategory
  title: string
  description: string
  evidenceExecutionIds: string[]
  projectsUsed: string[]
}

/** DNA entries are never mutated — a new fact about a product appends a new version; nothing here ever overwrites an existing entry in place. */
export type EngineeringDNAEntry = {
  id: string
  productSlug: string
  category: string
  title: string
  description: string
  evidenceExecutionIds: string[]
  version: number
  createdAt: string
  supersedes: string | null
}

export type EngineeringDNAProfile = {
  productSlug: string
  /** The latest version of each logical entry (by title+category). */
  current: EngineeringDNAEntry[]
  /** Every version ever recorded — retained permanently. */
  history: EngineeringDNAEntry[]
}

export type LearningConfidence = 'High' | 'Medium' | 'Low'

export type LearningReport = {
  lessonsLearned: string[]
  newKnowledge: EngineeringMemoryEntry[]
  patternsDetected: EngineeringPattern[]
  dnaChanges: EngineeringDNAEntry[]
  mostSuccessfulDecisions: DecisionMemoryEntry[]
  leastSuccessfulDecisions: DecisionMemoryEntry[]
  mostAccurateAgent: AgentScorecard | null
  leastAccurateAgent: AgentScorecard | null
  recommendationAccuracy: number | null
  architectureImprovements: string[]
  knowledgeGrowth: number
  learningConfidence: LearningConfidence
}

/** What the Knowledge Engine hands back before an execution — injected into the Runtime Context so the Runtime never re-solves an already-validated problem. */
export type RelevantKnowledge = {
  memoryEntries: EngineeringMemoryEntry[]
  dnaEntries: EngineeringDNAEntry[]
  patterns: EngineeringPattern[]
  similarExecutions: ExecutionLearningRecord[]
  confidence: LearningConfidence
}

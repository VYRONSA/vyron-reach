import type { ExecutiveEngineeringReport } from '../intelligence/engineeringIntelligenceEngine'
import type { ExecutiveEngineeringStrategy } from '../director/directorTypes'
import type { DevelopmentContext } from '../runtime/runtimeContextBuilder'
import type { PlannedTask } from '../runtime/developmentPlanningEngine'
import type { DevelopmentJob } from '../runtime/runtimeTypes'

export type AgentRole =
  | 'Project Manager'
  | 'Architect'
  | 'Backend'
  | 'Frontend'
  | 'Database'
  | 'AI'
  | 'QA'
  | 'Security'
  | 'Documentation'
  | 'Release Manager'

/**
 * Per the explicit architecture decision for this batch: agents are
 * deterministic specialist reviewers, not separate Claude Code
 * executions. Every agent receives exactly the five inputs the batch
 * spec names — nothing more is threaded in, so no agent can reach for
 * data outside its stated contract.
 */
export type AgentInput = {
  context: DevelopmentContext
  report: ExecutiveEngineeringReport
  strategy: ExecutiveEngineeringStrategy
  task: PlannedTask | null
  previousExecution: DevelopmentJob | null
  developmentRules: string
}

export type AgentDecision = {
  decision: string
  reason: string
}

export type AgentConfidence = 'High' | 'Medium' | 'Low'

/**
 * Every field traces to data the agent was actually given — evidence and
 * risks are Engineering Intelligence findings this agent selected (never
 * new ones), filesModified is a prediction derived from the most relevant
 * past handover's real files (never invented). executionDurationMs and
 * cost are both genuinely measured/known: agents run no AI call, so cost
 * is truly 0, not an unknown masquerading as a number.
 */
export type AgentOutput = {
  role: AgentRole
  summary: string
  evidence: string[]
  decisions: AgentDecision[]
  filesModified: string[]
  risks: ExecutiveEngineeringReport['findings']
  recommendations: string[]
  confidence: AgentConfidence
  executionDurationMs: number
  cost: number
}

/** Detected when some agents' decisions imply blocking and others don't — never resolved by the Workforce itself, only escalated to the Director (see resolveAgentConflict). */
export type AgentConflict = {
  description: string
  involvedAgents: AgentRole[]
  resolution: string | null
}

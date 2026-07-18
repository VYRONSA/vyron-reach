import { resolveAgentConflict } from '../director/engineeringDirector'
import { evaluateProjectManager, determineRequiredAgents } from './projectManagerAgent'
import { evaluateArchitect } from './architectAgent'
import { evaluateBackend } from './backendAgent'
import { evaluateFrontend } from './frontendAgent'
import { evaluateDatabase } from './databaseAgent'
import { evaluateAI } from './aiAgent'
import { evaluateQA } from './qaAgent'
import { evaluateSecurity } from './securityAgent'
import { evaluateDocumentation } from './documentationAgent'
import { evaluateReleaseManager } from './releaseManagerAgent'
import { getActiveProvider } from './providerAdapter'
import type { AgentConflict, AgentDecision, AgentInput, AgentOutput, AgentRole } from './agentTypes'

export type WorkforceReport = {
  executiveSummary: string
  agentsUsed: AgentRole[]
  agentOutputs: AgentOutput[]
  decisionsMade: AgentDecision[]
  conflicts: AgentConflict[]
  risks: AgentOutput['risks']
  filesModified: string[]
  costPerAgent: Record<string, number>
  durationPerAgent: Record<string, number>
  totalRuntimeMs: number
  overallConfidence: 'High' | 'Medium' | 'Low'
  readyForApply: boolean
  provider: string
}

const DOMAIN_AGENT_EVALUATORS: Partial<Record<AgentRole, (input: AgentInput) => AgentOutput>> = {
  Backend: evaluateBackend,
  Frontend: evaluateFrontend,
  Database: evaluateDatabase,
  AI: evaluateAI,
  Security: evaluateSecurity,
  Documentation: evaluateDocumentation,
}

/**
 * A blocking decision is any decision whose text implies work should not
 * proceed — a plain keyword check over language every agent already
 * writes deliberately ("Blocked", "Needs Review"), not a new judgment
 * layered on top of what each agent already decided.
 */
function isBlockingDecision(decision: AgentDecision): boolean {
  const text = decision.decision.toLowerCase()
  return text.includes('block') || text.includes('needs review')
}

function detectConflicts(outputs: AgentOutput[]): AgentConflict[] {
  const blockingAgents = outputs.filter(o => o.decisions.some(isBlockingDecision)).map(o => o.role)
  const clearAgents = outputs.filter(o => !o.decisions.some(isBlockingDecision)).map(o => o.role)
  if (blockingAgents.length === 0 || clearAgents.length === 0) return []
  return [
    {
      description: `${blockingAgents.join(', ')} flagged blocking concerns while ${clearAgents.join(', ')} did not.`,
      involvedAgents: [...blockingAgents, ...clearAgents],
      resolution: null,
    },
  ]
}

/**
 * The Multi-Agent Workforce Orchestrator. Runs the team in the specified
 * order — Project Manager → Architect → assigned specialists (in
 * parallel, since none of them touch shared mutable state or each
 * other's output) → QA → Security → Release Manager — then escalates any
 * disagreement to the Engineering Director rather than picking a side.
 * Exactly one shared execution belongs to this task: the Workforce itself
 * never calls a provider: it only decides what a single downstream
 * Runtime execution should do, informed by every agent's review.
 */
export async function runAgentWorkforce(input: AgentInput): Promise<WorkforceReport> {
  const workforceStart = Date.now()

  const projectManagerOutput = evaluateProjectManager(input)
  const requiredDomainAgents = determineRequiredAgents(input)

  const architectOutput = evaluateArchitect(input)

  const domainOutputs = await Promise.all(
    requiredDomainAgents.map(role => Promise.resolve(DOMAIN_AGENT_EVALUATORS[role]!(input)))
  )

  const qaOutput = evaluateQA(input)
  const securityOutput = evaluateSecurity(input)
  const releaseManagerOutput = evaluateReleaseManager(input)

  const agentOutputs = [projectManagerOutput, architectOutput, ...domainOutputs, qaOutput, securityOutput, releaseManagerOutput]

  const conflicts = detectConflicts(agentOutputs)
  for (const conflict of conflicts) {
    conflict.resolution = resolveAgentConflict(conflict.description, input.report)
  }

  const anyUnresolvedBlock = conflicts.some(c => c.resolution?.includes('siding with the blocking position'))
  const anyAgentBlocking = agentOutputs.some(o => o.decisions.some(isBlockingDecision)) && conflicts.length === 0

  const filesModified = [...new Set(agentOutputs.flatMap(o => o.filesModified))]
  const decisionsMade = agentOutputs.flatMap(o => o.decisions)
  const risks = agentOutputs.flatMap(o => o.risks)

  const costPerAgent: Record<string, number> = {}
  const durationPerAgent: Record<string, number> = {}
  for (const output of agentOutputs) {
    costPerAgent[output.role] = output.cost
    durationPerAgent[output.role] = output.executionDurationMs
  }

  const confidenceRank: Record<AgentOutput['confidence'], number> = { Low: 0, Medium: 1, High: 2 }
  const overallConfidence = agentOutputs.reduce<AgentOutput['confidence']>(
    (worst, o) => (confidenceRank[o.confidence] < confidenceRank[worst] ? o.confidence : worst),
    'High'
  )

  const readyForApply = !anyUnresolvedBlock && !anyAgentBlocking

  return {
    executiveSummary: `${agentOutputs.length} agent(s) reviewed "${input.task?.title ?? 'no selected task'}". ${
      readyForApply ? 'Ready to proceed with one shared execution.' : 'Blocking concerns outstanding — see conflicts/decisions.'
    }`,
    agentsUsed: agentOutputs.map(o => o.role),
    agentOutputs,
    decisionsMade,
    conflicts,
    risks,
    filesModified,
    costPerAgent,
    durationPerAgent,
    totalRuntimeMs: Date.now() - workforceStart,
    overallConfidence,
    readyForApply,
    provider: getActiveProvider().displayName,
  }
}

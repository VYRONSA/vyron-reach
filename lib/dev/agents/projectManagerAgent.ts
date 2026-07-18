import { buildAgentOutput, matchesDomain } from './agentSupport'
import type { AgentDecision, AgentInput, AgentOutput, AgentRole } from './agentTypes'

const DOMAIN_AGENT_ROLES: AgentRole[] = ['Backend', 'Frontend', 'Database', 'AI', 'Security', 'Documentation']

/**
 * Determines which specialist agents are relevant to the selected task —
 * matched against the task's own title/description/evidence/href, the
 * same text every other domain agent already has access to. Backend,
 * Frontend, Database, AI, Security, and Documentation are conditional;
 * Architect, QA, and Release Manager are universal (design sanity,
 * validation, and release readiness apply to every task) and are added
 * by the Workforce Orchestrator directly rather than through matching.
 */
export function determineRequiredAgents(input: AgentInput): AgentRole[] {
  const task = input.task
  const searchText = task ? `${task.title} ${task.description} ${task.evidence} ${task.href}` : ''
  const matched = DOMAIN_AGENT_ROLES.filter(role => matchesDomain(role, searchText))
  // No domain pattern matched anything concrete — default to Backend + Frontend rather than running zero specialists on real work.
  return matched.length > 0 ? matched : ['Backend', 'Frontend']
}

/**
 * Project Manager Agent — sequencing and blocker detection over data
 * already assembled upstream. "Break large work into tasks" is answered
 * by flagging the selected task's own estimatedEffort rather than
 * inventing a task breakdown; "detect blockers" reads the Director's own
 * topPriorityFinding/recommendedDeferredWork, since Director Strategy is
 * this agent's actual input, not the raw Dependency Engine.
 */
export function evaluateProjectManager(input: AgentInput): AgentOutput {
  const start = Date.now()
  const { task, strategy } = input
  const decisions: AgentDecision[] = []

  const requiredAgents = determineRequiredAgents(input)
  decisions.push({
    decision: `Assign: ${requiredAgents.join(', ')}`,
    reason: task
      ? `Domain pattern match against the selected task ("${task.title}").`
      : 'No task selected — defaulting to Backend and Frontend review.',
  })

  if (task && (task.estimatedEffort === 'Large' || task.priority === 'Critical')) {
    decisions.push({
      decision: 'Recommend sequencing as its own focused cycle rather than bundling further work',
      reason: `Estimated effort: ${task.estimatedEffort}, priority: ${task.priority}.`,
    })
  }

  const blockerFindings = strategy.topPriorityFinding ? [strategy.topPriorityFinding] : []
  const summary = task
    ? `Sequencing "${task.title}" (${task.priority} priority, ${task.estimatedEffort} effort) across: ${requiredAgents.join(', ')}.`
    : 'No task currently selected — nothing to sequence.'

  return buildAgentOutput('Project Manager', blockerFindings, [], summary, decisions, start)
}

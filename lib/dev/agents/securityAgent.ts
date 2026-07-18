import { buildAgentOutput } from './agentSupport'
import type { AgentDecision, AgentInput, AgentOutput } from './agentTypes'

/**
 * Security Agent — security review/authentication/authorization/secrets/
 * vulnerabilities. Scoped entirely to Quality Intelligence's own Security
 * Concern findings (committed-secret patterns, dangerouslySetInnerHTML
 * usage). This system has no dependency-vulnerability database access
 * and no auth-flow simulator, so "authentication/authorization" review
 * is limited to whatever Security Concern findings actually surfaced —
 * never a broader claim than that.
 */
export function evaluateSecurity(input: AgentInput): AgentOutput {
  const start = Date.now()
  const relevant = input.report.findings.filter(f => f.category === 'Security Concern')
  const blocking = relevant.some(f => f.severity === 'Critical')

  const decisions: AgentDecision[] = [
    {
      decision: blocking ? 'Blocked — committed secret or critical exposure detected' : relevant.length > 0 ? 'Needs Review' : 'Approved',
      reason: relevant.length > 0 ? relevant.map(f => f.evidence).join(' | ') : 'No Security Concern findings outstanding.',
    },
  ]

  return buildAgentOutput('Security', relevant, [], `${relevant.length} Security Concern finding(s) reviewed.`, decisions, start)
}

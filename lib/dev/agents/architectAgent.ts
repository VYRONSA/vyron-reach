import { buildAgentOutput, predictFilesForDomain } from './agentSupport'
import type { AgentDecision, AgentInput, AgentOutput } from './agentTypes'

/**
 * Architect Agent — design/coupling/standards review, entirely over
 * Code Intelligence's own Architecture Violation and Duplicated Code
 * findings (the two categories that actually speak to coupling and
 * platform-standard drift). Approval is a direct read of severity, not a
 * new judgment: Critical/High findings block approval, anything else
 * doesn't.
 */
export function evaluateArchitect(input: AgentInput): AgentOutput {
  const start = Date.now()
  const relevant = input.report.findings.filter(
    f => f.module === 'Code' && (f.category === 'Architecture Violation' || f.category === 'Duplicated Code')
  )
  const blocking = relevant.filter(f => f.severity === 'Critical' || f.severity === 'High')

  const decisions: AgentDecision[] = [
    {
      decision: blocking.length === 0 ? 'Approved' : 'Needs Review',
      reason:
        blocking.length === 0
          ? `No Critical/High architecture findings outstanding (Repository Health: ${input.report.repositoryHealth}).`
          : `${blocking.length} Critical/High architecture finding(s) outstanding.`,
    },
  ]

  const summary = `Repository Health: ${input.report.repositoryHealth}. ${relevant.length} architecture-related finding(s) reviewed.`
  return buildAgentOutput('Architect', relevant, predictFilesForDomain('Architect', input.context), summary, decisions, start)
}

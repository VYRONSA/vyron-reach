import { buildAgentOutput, predictFilesForDomain } from './agentSupport'
import type { AgentDecision, AgentInput, AgentOutput } from './agentTypes'

/**
 * Frontend Agent — UI/UX/components/accessibility/responsiveness. This
 * system has no accessibility or responsive-layout scanner, so those two
 * responsibilities are honestly out of scope for automated detection;
 * this agent reviews what Code Intelligence can actually see — Large
 * Component and Duplicated Code findings under components/ or
 * app/dev/**\/page.tsx.
 */
export function evaluateFrontend(input: AgentInput): AgentOutput {
  const start = Date.now()
  const filesModified = predictFilesForDomain('Frontend', input.context)
  const relevant = input.report.findings.filter(
    f => f.module === 'Code' && f.location && (f.location.startsWith('components/') || /^app\/dev\/.*page\.tsx/.test(f.location))
  )

  const decisions: AgentDecision[] = [
    {
      decision: relevant.some(f => f.severity === 'Critical' || f.severity === 'High') ? 'Needs Review' : 'Clear to implement',
      reason: relevant.length > 0 ? `${relevant.length} frontend-relevant finding(s) outstanding.` : 'No frontend-relevant findings outstanding.',
    },
  ]

  return buildAgentOutput(
    'Frontend',
    relevant,
    filesModified,
    `${relevant.length} frontend-relevant finding(s) reviewed (accessibility/responsiveness are not automatically checkable in this system).`,
    decisions,
    start
  )
}

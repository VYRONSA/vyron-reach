import { buildAgentOutput } from './agentSupport'
import type { AgentDecision, AgentInput, AgentOutput } from './agentTypes'

/**
 * Release Manager Agent — final review/release readiness/deployment
 * approval/rollback strategy, at the PLANNING stage (before this task's
 * execution). This is deliberately distinct from the Operations
 * Platform's Release Readiness Engine (Phase 4 Batch 5), which determines
 * readiness AFTER a change is applied using Quality Gate/Risk Assessment
 * results that don't exist yet at planning time — this agent forms an
 * early opinion from the Engineering Report and Director Strategy alone,
 * the two inputs it actually has.
 */
export function evaluateReleaseManager(input: AgentInput): AgentOutput {
  const start = Date.now()
  const { report, strategy } = input
  const blocking = report.criticalIssues.length > 0 || report.deliveryRisk === 'Critical'

  const decisions: AgentDecision[] = [
    {
      decision: blocking ? 'Blocked' : report.deliveryRisk === 'High' ? 'Proceed with caution' : 'Clear for this cycle',
      reason: `Delivery Risk: ${report.deliveryRisk}. ${report.criticalIssues.length} critical issue(s) outstanding. Director recommendation: ${strategy.overallRecommendation}`,
    },
  ]

  return buildAgentOutput(
    'Release Manager',
    report.criticalIssues,
    [],
    `Delivery Risk: ${report.deliveryRisk}, Engineering Score: ${report.engineeringScore}/100.`,
    decisions,
    start
  )
}

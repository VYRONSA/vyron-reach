import type { DevelopmentDependencyStatus } from '../developmentDependencyEngine'
import type { ExecutiveActionQueue } from '../executiveActionEngine'
import type { ExecutiveEngineeringReport, EngineeringHealth } from '../intelligence/engineeringIntelligenceEngine'
import type { EngineeringFinding, EngineeringModule, FindingSeverity } from '../intelligence/types'
import type { DevelopmentContext } from '../runtime/runtimeContextBuilder'
import type { DirectorAssessmentInput } from '../assessment/assessmentTypes'
import type {
  ExecutiveEngineeringStrategy,
  PriorityChange,
  DeferredWorkItem,
  AcceleratedWorkItem,
  SprintItem,
  DeliveryConfidence,
  RiskLevel,
} from './directorTypes'

const SEVERITY_RANK: FindingSeverity[] = ['Critical', 'High', 'Medium', 'Low']

function sortBySeverity(findings: EngineeringFinding[]): EngineeringFinding[] {
  return [...findings].sort((a, b) => SEVERITY_RANK.indexOf(a.severity) - SEVERITY_RANK.indexOf(b.severity))
}

/** Question 1/2: is development aimed at the right thing, and is it the highest-value work? Answered by the single highest-severity finding — the Engineering Intelligence Engine has already ranked everything by evidence-backed severity; the Director doesn't re-judge value, it reads the ranking. */
function determineTopPriorityFinding(report: ExecutiveEngineeringReport): EngineeringFinding | null {
  const sorted = sortBySeverity(report.findings)
  return sorted[0] ?? null
}

function determineStrategicGoal(topFinding: EngineeringFinding | null, actionQueue: ExecutiveActionQueue): string {
  if (topFinding && (topFinding.severity === 'Critical' || topFinding.severity === 'High')) {
    return `Resolve: ${topFinding.title}`
  }
  if (actionQueue.topAction) return actionQueue.topAction.title
  return 'Continue steady-state development.'
}

const THEME_BY_MODULE: Partial<Record<EngineeringModule, string>> = {
  Build: 'Stabilization',
  Git: 'Repository Hygiene',
  Code: 'Code Quality',
  Database: 'Data Integrity',
  Product: 'Product Definition',
  Documentation: 'Documentation',
  'Technical Debt': 'Debt Reduction',
  Runtime: 'Runtime Reliability',
  Quality: 'Quality Hardening',
}

/** Question 8 (partial): the dominant module among Critical/High findings names the current theme — a count, not a judgment. */
function determineDevelopmentTheme(findings: EngineeringFinding[]): string {
  const counts = new Map<EngineeringModule, number>()
  for (const f of findings) {
    if (f.severity === 'Critical' || f.severity === 'High') counts.set(f.module, (counts.get(f.module) ?? 0) + 1)
  }
  if (counts.size === 0) return 'Feature Development'
  const [topModule] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  return THEME_BY_MODULE[topModule] ?? 'Feature Development'
}

function determineProductFocus(context: DevelopmentContext): string {
  return context.currentMilestone ?? context.product
}

function riskFromCount(count: number, [low, high, critical]: [number, number, number]): RiskLevel {
  if (count >= critical) return 'Critical'
  if (count >= high) return 'High'
  if (count >= low) return 'Medium'
  return 'Low'
}

/** Question 5: product/vision alignment, read from Product Intelligence's own findings plus critical dependency blockers — not a new semantic judgment. */
function computeProductRisk(findings: EngineeringFinding[], dependencies: DevelopmentDependencyStatus): RiskLevel {
  const productFindings = findings.filter(f => f.module === 'Product').length
  const criticalBlockers = dependencies.blockers.filter(b => b.severity === 'Critical').length
  return riskFromCount(productFindings + criticalBlockers, [1, 3, 6])
}

/** Question 3/4: debt and architecture-drift risk, from Technical Debt/Code/Build findings already computed. */
function computeTechnicalRisk(findings: EngineeringFinding[]): RiskLevel {
  const relevant = findings.filter(f => f.module === 'Technical Debt' || f.module === 'Code' || f.module === 'Build')
  const criticalOrHigh = relevant.filter(f => f.severity === 'Critical' || f.severity === 'High').length
  return riskFromCount(criticalOrHigh, [1, 2, 4])
}

/**
 * Question 6: this system has no revenue/commercial data anywhere — this
 * is explicitly a proxy built only from Delivery Risk and Product
 * Completion (both already computed), not a claim of real commercial
 * insight.
 */
function computeCommercialRisk(deliveryRisk: ExecutiveEngineeringReport['deliveryRisk'], productCompletion: number): RiskLevel {
  if (deliveryRisk === 'Critical') return 'Critical'
  if (deliveryRisk === 'High' && productCompletion < 50) return 'High'
  if (deliveryRisk === 'High' || productCompletion < 30) return 'Medium'
  return 'Low'
}

const CONFIDENCE_FROM_RISK: Record<ExecutiveEngineeringReport['deliveryRisk'], DeliveryConfidence> = {
  Low: 'High',
  Medium: 'Medium',
  High: 'Low',
  Critical: 'Low',
}

/** Question 9: Low-severity, non-urgent findings are candidates to explicitly defer rather than silently accumulate. */
function evaluateDeferredWork(findings: EngineeringFinding[]): DeferredWorkItem[] {
  return findings
    .filter(f => f.severity === 'Low')
    .slice(0, 5)
    .map(f => ({ finding: f, reason: `Low severity, non-blocking — evidence: ${f.evidence}` }))
}

/** Question 10: Critical/High findings beyond the single top-ranked one — worth scheduling soon, without claiming any one of them should jump the queue. */
function evaluateAcceleratedWork(findings: EngineeringFinding[], topFinding: EngineeringFinding | null): AcceleratedWorkItem[] {
  return findings
    .filter(f => (f.severity === 'Critical' || f.severity === 'High') && f !== topFinding)
    .slice(0, 5)
    .map(f => ({ finding: f, reason: `${f.severity} severity, not yet top of the queue — evidence: ${f.evidence}` }))
}

/**
 * Question 7/8: development becoming repetitive is exactly what Runtime
 * Intelligence's Execution Loop / Repeated Recommendation / Recurring
 * Failure / Stalled Development categories already detect. Recurrence is
 * new evidence beyond the individual finding, so those specific findings
 * are recommended one severity tier higher than their original —
 * re-ranking an existing finding, never inventing a new one.
 */
const ESCALATION_CATEGORIES = new Set(['Execution Loop', 'Repeated Recommendation', 'Recurring Failure', 'Stalled Development'])

function evaluatePriorityChanges(findings: EngineeringFinding[]): PriorityChange[] {
  return findings
    .filter(f => f.module === 'Runtime' && ESCALATION_CATEGORIES.has(f.category) && f.severity !== 'Critical')
    .map(f => {
      const idx = SEVERITY_RANK.indexOf(f.severity)
      const recommendedPriority = SEVERITY_RANK[Math.max(0, idx - 1)]
      return {
        finding: f,
        originalPriority: f.severity,
        recommendedPriority,
        reason: `Recurrence detected (${f.category}) — recurrence is itself evidence of an unresolved pattern. Evidence: ${f.evidence}`,
      }
    })
}

function buildNextSprint(findings: EngineeringFinding[], dependencies: DevelopmentDependencyStatus, limit = 5): SprintItem[] {
  const fromFindings: SprintItem[] = sortBySeverity(findings)
    .slice(0, limit)
    .map(f => ({ title: f.title, source: `${f.module} Intelligence`, href: f.location ?? '/dev', priority: f.severity }))
  const fromReady: SprintItem[] = dependencies.readyWork
    .slice(0, limit)
    .map(w => ({ title: w.label, source: 'Development Dependency Intelligence', href: w.href, priority: 'Medium' as FindingSeverity }))
  return [...fromFindings, ...fromReady].slice(0, limit)
}

function buildOverallRecommendation(
  topFinding: EngineeringFinding | null,
  report: ExecutiveEngineeringReport,
  actionQueue: ExecutiveActionQueue
): string {
  if (topFinding && topFinding.severity === 'Critical') {
    return `Critical issue requires immediate attention: ${topFinding.title} (${topFinding.evidence}).`
  }
  if (report.deliveryRisk === 'High' || report.deliveryRisk === 'Critical') {
    return `Delivery risk is ${report.deliveryRisk.toLowerCase()} — prioritize ${topFinding?.title ?? 'outstanding High-severity findings'} before starting new work.`
  }
  if (actionQueue.topAction) {
    return `Continue with ${actionQueue.topAction.title}.`
  }
  return 'Engineering health is stable — proceed with the next planned batch.'
}

/**
 * The Autonomous Engineering Director — the strategic layer above the
 * Planning Engine. It never executes anything and never invents a
 * finding: every output is either a direct read of an already-computed
 * value (Engineering Score, Delivery Risk, Architecture/Repository
 * Health) or a re-ranking of an EngineeringFinding that already exists.
 * Takes the already-assembled Runtime Context (Batch 3) as its primary
 * input rather than re-fetching Product Vision/Architecture Decisions/
 * Technical Debt/Development Queue/Repository Status/Runtime History
 * separately — those already live on DevelopmentContext.
 */
export function evaluateEngineeringStrategy(
  context: DevelopmentContext,
  report: ExecutiveEngineeringReport,
  actionQueue: ExecutiveActionQueue,
  dependencies: DevelopmentDependencyStatus
): ExecutiveEngineeringStrategy {
  const topPriorityFinding = determineTopPriorityFinding(report)

  return {
    currentStrategicGoal: determineStrategicGoal(topPriorityFinding, actionQueue),
    currentDevelopmentTheme: determineDevelopmentTheme(report.findings),
    currentProductFocus: determineProductFocus(context),
    deliveryConfidence: CONFIDENCE_FROM_RISK[report.deliveryRisk],
    architectureHealth: report.repositoryHealth as EngineeringHealth,
    productRisk: computeProductRisk(report.findings, dependencies),
    technicalRisk: computeTechnicalRisk(report.findings),
    commercialRisk: computeCommercialRisk(report.deliveryRisk, report.productCompletion),
    recommendedPriorityChanges: evaluatePriorityChanges(report.findings),
    recommendedDeferredWork: evaluateDeferredWork(report.findings),
    recommendedAcceleratedWork: evaluateAcceleratedWork(report.findings, topPriorityFinding),
    recommendedNextSprint: buildNextSprint(report.findings, dependencies),
    overallRecommendation: buildOverallRecommendation(topPriorityFinding, report, actionQueue),
    topPriorityFinding,
  }
}

/**
 * The Multi-Agent Workforce's escalation path when specialist agents
 * disagree — never resolved by picking a side arbitrarily. The Director
 * decides using the same Engineering Intelligence Report every other
 * decision in this system already defers to: if any Critical/High
 * finding exists, the Director sides with whichever agents flagged a
 * blocking concern (severity-first, the same rule every other engine in
 * this system already applies); otherwise it sides with proceeding, since
 * nothing in the Engineering Report actually backs the objection.
 */
export function resolveAgentConflict(description: string, report: ExecutiveEngineeringReport): string {
  if (report.criticalIssues.length > 0) {
    return `Director resolution: siding with the blocking position — ${report.criticalIssues.length} Critical Engineering Intelligence finding(s) outstanding (${report.criticalIssues[0].title}).`
  }
  if (report.highIssues.length > 0) {
    return `Director resolution: siding with the blocking position — ${report.highIssues.length} High Engineering Intelligence finding(s) outstanding (${report.highIssues[0].title}).`
  }
  return `Director resolution: siding with proceeding — no Critical/High Engineering Intelligence finding backs the objection (${description}).`
}

const CONFIDENCE_RANK: Record<DeliveryConfidence, number> = { Low: 0, Medium: 1, High: 2 }

/**
 * The Assessment Engine's intended hand-off point to the Director —
 * "Engineering Director receives Assessment Report, Recommendations,
 * Risk Summary, Confidence. The Director decides what work should
 * happen next." Deliberately additive and optional: evaluateEngineeringStrategy's
 * own signature and every existing call site are untouched, since
 * Assessment findings (repository/architecture/documentation/security
 * scores) are a second, independent evidence source layered on top of a
 * strategy already built from the Engineering Intelligence Report, not
 * a replacement for it. This only ever tightens delivery confidence
 * (never loosens it) when Assessment confidence is lower than what the
 * Engineering Intelligence Report alone concluded — Assessment evidence
 * is corroborating, so a lower reading from it is a reason for caution,
 * a higher one is not treated as license to relax an already-earned
 * caution.
 */
export function applyAssessmentInput(strategy: ExecutiveEngineeringStrategy, assessment: DirectorAssessmentInput): ExecutiveEngineeringStrategy {
  const assessmentConfidence: DeliveryConfidence = assessment.confidence.score >= 80 ? 'High' : assessment.confidence.score >= 55 ? 'Medium' : 'Low'
  const tighter = CONFIDENCE_RANK[assessmentConfidence] < CONFIDENCE_RANK[strategy.deliveryConfidence]

  return {
    ...strategy,
    deliveryConfidence: tighter ? assessmentConfidence : strategy.deliveryConfidence,
    overallRecommendation: tighter
      ? `${strategy.overallRecommendation} Engineering Assessment lowers confidence to ${assessmentConfidence} (${assessment.confidence.reasons.join(' ')}) — ${assessment.riskSummary}`
      : strategy.overallRecommendation,
  }
}

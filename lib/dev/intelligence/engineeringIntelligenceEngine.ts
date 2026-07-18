import type { Project } from '../projectsData'
import type { Milestone } from '../milestonesStorage'
import type { Batch } from '../batchesStorage'
import type { TechnicalDebt } from '../technicalDebtStorage'
import type { Decision } from '../decisionsStorage'
import type { Handover } from '../handoverStorage'
import type { DevelopmentJob } from '../runtime/runtimeTypes'
import { scanProductIntelligence } from './productIntelligenceModule'
import { scanTechnicalDebtIntelligence } from './technicalDebtIntelligenceModule'
import { scanRuntimeIntelligence } from './runtimeIntelligenceModule'
import { scanDocumentationIntelligenceClient } from './documentationIntelligenceClient'
import type { EngineeringFinding, FindingSeverity } from './types'

export type EngineeringHealth = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical'
export type DeliveryRisk = 'Low' | 'Medium' | 'High' | 'Critical'

export type RecommendedEngineeringTask = {
  finding: EngineeringFinding
  reason: string
  estimatedImpact: string
  estimatedEffort: string
  confidence: 'High' | 'Medium' | 'Low'
}

export type ExecutiveEngineeringReport = {
  findings: EngineeringFinding[]
  criticalIssues: EngineeringFinding[]
  highIssues: EngineeringFinding[]
  mediumIssues: EngineeringFinding[]
  lowIssues: EngineeringFinding[]
  engineeringScore: number
  overallHealth: EngineeringHealth
  deliveryRisk: DeliveryRisk
  technicalDebtScore: number
  buildHealth: EngineeringHealth
  repositoryHealth: EngineeringHealth
  documentationHealth: EngineeringHealth
  runtimeHealth: EngineeringHealth
  productCompletion: number
  recommendedTask: RecommendedEngineeringTask | null
}

const SEVERITY_PENALTY: Record<FindingSeverity, number> = { Critical: 20, High: 10, Medium: 4, Low: 1 }
const SEVERITY_RANK: Record<FindingSeverity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }
const IMPACT_BY_SEVERITY: Record<FindingSeverity, string> = {
  Critical: 'Blocks all further development until resolved.',
  High: 'Significantly slows delivery until resolved.',
  Medium: 'Should be addressed soon to avoid compounding.',
  Low: 'Minor — safe to defer.',
}
/** A deterministic size bucket, not a precise estimate — this engine has no real effort-estimation capability, only a category-based rule of thumb. */
const EFFORT_BY_CATEGORY: Record<string, string> = {
  'TODO Comment': 'Small',
  'FIXME Comment': 'Small',
  'HACK Comment': 'Medium',
  'Large Component': 'Large',
  'Duplicated Code': 'Medium',
  'Unused File': 'Small',
  'Dead Route': 'Small',
  'Architecture Violation': 'Medium',
  'Failed Build': 'Medium',
  'TypeScript Failing': 'Medium',
  'Dependency Problem': 'Small',
  'Uncommitted Changes': 'Small',
  'Large Change Set': 'Medium',
  'Merge Risk': 'Medium',
  'Diff Summary': 'Small',
  'Migration Ordering': 'Small',
  'Missing Database Documentation': 'Small',
  'Product Vision': 'Small',
  'Unfinished Milestone': 'Medium',
  'Incomplete Batch': 'Medium',
  'Orphaned Objective': 'Small',
  'Undocumented Module': 'Small',
  'Missing Documentation': 'Small',
  'Missing Architecture Decisions': 'Small',
  'Recurring Failure': 'Medium',
  'Repeated Recommendation': 'Small',
  'Execution Loop': 'Large',
  'Stalled Development': 'Medium',
  'Missing Tests': 'Large',
  'Security Concern': 'Medium',
  'Inconsistent Error Handling': 'Small',
  'Performance Concern': 'Small',
}

function computeScore(findings: EngineeringFinding[]): number {
  const penalty = findings.reduce((sum, f) => sum + SEVERITY_PENALTY[f.severity], 0)
  return Math.max(0, 100 - penalty)
}

export function healthFromScore(score: number): EngineeringHealth {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 55) return 'Fair'
  if (score >= 30) return 'Poor'
  return 'Critical'
}

function deliveryRiskFromFindings(findings: EngineeringFinding[]): DeliveryRisk {
  const critical = findings.filter(f => f.severity === 'Critical').length
  const high = findings.filter(f => f.severity === 'High').length
  if (critical > 0) return 'Critical'
  if (high >= 3) return 'High'
  if (high > 0) return 'Medium'
  return 'Low'
}

function moduleHealth(findings: EngineeringFinding[], modules: EngineeringFinding['module'][]): EngineeringHealth {
  return healthFromScore(computeScore(findings.filter(f => modules.includes(f.module))))
}

function recommendTask(findings: EngineeringFinding[]): RecommendedEngineeringTask | null {
  const ordered = [...findings].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
  const top = ordered[0]
  if (!top) return null
  return {
    finding: top,
    reason: top.evidence,
    estimatedImpact: IMPACT_BY_SEVERITY[top.severity],
    estimatedEffort: EFFORT_BY_CATEGORY[top.category] ?? 'Medium',
    confidence: top.location ? 'High' : 'Medium',
  }
}

/**
 * Computes every localStorage-backed Intelligence Module (Product,
 * Technical Debt, Runtime, Documentation notes) — the half of Engineering
 * Intelligence that doesn't need filesystem access. Kept separate from
 * buildExecutiveEngineeringReport so a caller (Mission Control) can fetch
 * the server-side findings and compute these client findings in parallel.
 */
export function computeClientEngineeringFindings(input: {
  project: Project | undefined
  milestones: Milestone[]
  batches: Batch[]
  debt: TechnicalDebt[]
  decisions: Decision[]
  jobs: DevelopmentJob[]
  handovers: Handover[]
}): EngineeringFinding[] {
  const completedBatches = input.batches.filter(b => b.status === 'Complete' && !b.archived)
  return [
    ...scanProductIntelligence(input.project, input.milestones, input.batches),
    ...scanTechnicalDebtIntelligence(input.debt),
    ...scanRuntimeIntelligence(input.jobs, input.handovers),
    ...scanDocumentationIntelligenceClient(input.project?.slug ?? '', completedBatches, input.decisions),
  ]
}

/**
 * The Executive Intelligence layer — every field here is a deterministic
 * aggregation (counting, summing weighted penalties, sorting by severity)
 * over the findings the Intelligence Modules already produced. Nothing
 * here inspects code or data directly; it only summarizes what was
 * already, individually, evidence-backed.
 */
export function buildExecutiveEngineeringReport(
  serverFindings: EngineeringFinding[],
  clientFindings: EngineeringFinding[],
  productCompletion: number
): ExecutiveEngineeringReport {
  const findings = [...serverFindings, ...clientFindings]
  const criticalIssues = findings.filter(f => f.severity === 'Critical')
  const highIssues = findings.filter(f => f.severity === 'High')
  const mediumIssues = findings.filter(f => f.severity === 'Medium')
  const lowIssues = findings.filter(f => f.severity === 'Low')
  const engineeringScore = computeScore(findings)

  return {
    findings,
    criticalIssues,
    highIssues,
    mediumIssues,
    lowIssues,
    engineeringScore,
    overallHealth: healthFromScore(engineeringScore),
    deliveryRisk: deliveryRiskFromFindings(findings),
    technicalDebtScore: computeScore(findings.filter(f => f.module === 'Technical Debt')),
    buildHealth: moduleHealth(findings, ['Build']),
    repositoryHealth: moduleHealth(findings, ['Git', 'Code']),
    documentationHealth: moduleHealth(findings, ['Documentation']),
    runtimeHealth: moduleHealth(findings, ['Runtime']),
    productCompletion,
    recommendedTask: recommendTask(findings),
  }
}

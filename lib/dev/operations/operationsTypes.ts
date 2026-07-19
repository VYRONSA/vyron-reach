/**
 * Shared types for the Engineering Operations Platform. Several fields
 * here are explicitly nullable/optional because this system has no honest
 * source for them: no test runner (this repo has zero test files,
 * confirmed by Quality Intelligence), no deployment-triggering capability
 * (Deployment Intelligence has always been read-only), no lint-status
 * history. Those gaps are represented as null/"Skipped"/"Unavailable"
 * throughout this module, never guessed.
 */

export type LifecycleStage =
  | 'Requested'
  | 'Queued'
  | 'Planning'
  | 'Executing'
  | 'Validating'
  | 'Reviewing'
  | 'Applied'
  | 'Testing'
  | 'Ready for Deployment'
  | 'Deployed'
  | 'Completed'
  | 'Failed'
  | 'Rolled Back'

export type GateStatus = 'Passed' | 'Failed' | 'Skipped'

export type QualityGateResult = {
  gate: string
  status: GateStatus
  evidence: string
  remediation: string | null
}

export type QualityGateReport = {
  results: QualityGateResult[]
  allPassed: boolean
  failedGates: QualityGateResult[]
}

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'

export type RiskCategory = 'Implementation' | 'Deployment' | 'Architecture' | 'Regression' | 'Commercial' | 'Runtime'

export type RiskFactor = {
  category: RiskCategory
  level: RiskLevel
  evidence: string
}

export type RiskAssessment = {
  factors: RiskFactor[]
  overallRisk: RiskLevel
}

export type ReleaseReadiness = 'Ready for Review' | 'Ready for QA' | 'Ready for Staging' | 'Ready for Production' | 'Blocked'

export type ReleaseReadinessResult = {
  readiness: ReleaseReadiness
  reason: string
}

export type RollbackPoint = { hash: string; message: string; date: string }

export type DeploymentSnapshot = {
  branch: string
  commitHash: string
  commitMessage: string
  workingTreeStatus: string
  deploymentAvailable: boolean
  environment: string
  productionUrl: string
  rollbackPoints: RollbackPoint[]
  releaseNotes: string[]
}

export type ContinuousValidationResult = {
  buildStatus: 'Passing' | 'Failing'
  typescriptStatus: 'Passing' | 'Failing'
  /** Count of build warnings (e.g. Turbopack) — never affects buildStatus; a Passing build can still carry warnings. */
  buildWarningCount: number
  durationMs: number
  checkedAt: string
  buildOutput: string
  typescriptOutput: string
}

export type OperationsSnapshot = {
  timestamp: string
  projectSlug: string
  jobId: string | null
  engineeringScore: number
  overallHealth: string
  deliveryRisk: string
  technicalDebtScore: number
  productCompletion: number
  buildStatus: string
  typescriptStatus: string
  cost: number | null
  duration: number | null
  applied: boolean
}

export type TrendDirection = 'Improving' | 'Stable' | 'Declining' | 'Unknown'

export type ExecutiveOperationsDashboard = {
  overallPlatformHealth: string
  developmentVelocity: string
  executionSuccessRate: number
  engineeringTrend: TrendDirection
  technicalDebtTrend: TrendDirection
  releaseReadiness: ReleaseReadiness
  riskTrend: TrendDirection
  runtimePerformance: string
  averageClaudeCost: number | null
  averageRuntime: number | null
  /** Always null — this system has no deployment-triggering or deployment-outcome tracking capability. Never fabricated. */
  deploymentSuccess: number | null
}

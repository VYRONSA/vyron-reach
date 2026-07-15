import type {
  IsoDateTime,
  RiskLevel,
  VersionString,
} from '@/lib/ai-framework/types/base'

/**
 * Blocking Issue - Issue that blocks release
 */
export interface BlockingIssue {
  issueId: string
  description: string
  severity: RiskLevel
  detectedIn: string
  resolvedAt?: IsoDateTime
  resolutionNotes?: string
  status: 'open' | 'resolved' | 'deferred'
}

/**
 * Advisory Issue - Advisory issue that doesn't block but should be noted
 */
export interface AdvisoryIssue {
  issueId: string
  description: string
  severity: RiskLevel
  detectedIn: string
  acknowledgedAt?: IsoDateTime
  acknowledgedBy?: string
  mitigationStrategy?: string
  status: 'new' | 'acknowledged' | 'mitigated'
}

/**
 * Waiver Record - Approved waiver for known issue
 */
export interface WaiverRecord {
  waiverId: string
  issueId: string
  issueSummary: string
  riskSummary: string
  justification: string
  waiverApprovedBy: string
  waiverApprovedAt: IsoDateTime
  expiresAt?: IsoDateTime
  approvalNotes?: string
}

/**
 * Executive Approval - Executive-level approval for release
 */
export interface ExecutiveApproval {
  approvalId: string
  version: VersionString
  approvedBy: string
  approverTitle: string
  approvedAt: IsoDateTime
  approvalConditions?: string[]
  deploymentAuthority: 'full' | 'staged' | 'limited'
  notes?: string
}

/**
 * Release Readiness Status - Comprehensive release readiness status
 */
export interface ReleaseReadinessStatus {
  statusId: string
  version: VersionString
  timestamp: IsoDateTime
  assessedBy: string
  allBlockingIssuesResolved: boolean
  allMandatoryGatesPassed: boolean
  buildSucceeded: boolean
  testsPassed: boolean
  securityCleared: boolean
  governanceApproved: boolean
  documentationComplete: boolean
  architectureHealthy: boolean
  overallReadiness: 'ready' | 'blocked' | 'conditional'
}

/**
 * Final Release Recommendation - Final release recommendation
 */
export interface FinalReleaseRecommendation {
  recommendationId: string
  version: VersionString
  timestamp: IsoDateTime
  recommendedBy: string
  recommendedAction: 'proceed' | 'proceed-with-caution' | 'hold' | 'blocked'
  recommendation: string
  blockingIssues: BlockingIssue[]
  advisoryIssues: AdvisoryIssue[]
  waivers: WaiverRecord[]
  executiveApproval?: ExecutiveApproval
  requiredApprovals: string[]
  approvalStatus: 'pending' | 'approved' | 'rejected'
  deploymentReadiness: {
    productionReady: boolean
    stagingReady: boolean
    developmentReady: boolean
  }
  riskLevel: RiskLevel
  confidenceScore: number
  notes?: string
}

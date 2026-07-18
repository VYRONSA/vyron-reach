import { scanRepositoryFiles } from './repositoryScanner'
import { scanCodeIntelligence } from './codeIntelligence'
import { scanBuildIntelligence } from './buildFindingsIntelligence'
import { scanGitIntelligence } from './gitFindingsIntelligence'
import { scanDatabaseIntelligence } from './databaseIntelligence'
import { scanDocumentationIntelligence } from './documentationIntelligence'
import { scanQualityIntelligence } from './qualityIntelligence'
import { getBuildIntelligence } from '../buildIntelligence'
import { getGitIntelligence } from '../gitIntelligence'
import { captureGitDiffSummary } from '../gitDiffCapture'
import type { EngineeringFinding } from './types'

/**
 * Server-only entry point composing every fs/git-dependent Intelligence
 * Module in one pass — the repository is walked exactly once
 * (repositoryScanner) and shared across Code/Documentation/Quality
 * Intelligence rather than each re-scanning it. This is the half of the
 * Engineering Intelligence Engine that needs filesystem access; the other
 * half (Product/Technical Debt/Runtime/Documentation-notes, all
 * localStorage-backed) runs client-side and is merged in by
 * engineeringIntelligenceEngine.ts.
 */
export async function computeServerEngineeringFindings(hasSqlDocumentation: boolean): Promise<EngineeringFinding[]> {
  const files = scanRepositoryFiles()
  const build = getBuildIntelligence()
  const git = getGitIntelligence()
  const gitDiffSummary = await captureGitDiffSummary(process.cwd())

  return [
    ...scanCodeIntelligence(files),
    ...scanBuildIntelligence(build),
    ...scanGitIntelligence(git, files, gitDiffSummary),
    ...scanDatabaseIntelligence(hasSqlDocumentation),
    ...scanDocumentationIntelligence(files),
    ...scanQualityIntelligence(files),
  ]
}

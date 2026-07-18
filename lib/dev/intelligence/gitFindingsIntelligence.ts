import type { ScannedFile } from './repositoryScanner'
import type { GitIntelligence } from '../gitIntelligence'
import type { EngineeringFinding } from './types'

const LARGE_CHANGESET_THRESHOLD = 20

/**
 * Real git conflict markers, not just "a line starting with these
 * characters" — a decorative comment divider line of equals signs also
 * starts with 7 `=` characters but isn't a conflict marker. `=======` must
 * be the entire line; `<<<<<<<`/`>>>>>>>` must be alone or followed by a
 * space and a ref name, matching git's own generated format exactly.
 */
function isConflictMarkerLine(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed === '=======') return true
  if (trimmed === '<<<<<<<' || trimmed.startsWith('<<<<<<< ')) return true
  if (trimmed === '>>>>>>>' || trimmed.startsWith('>>>>>>> ')) return true
  return false
}

/**
 * Server-only. Reuses Git Intelligence's already-parsed .git state rather
 * than re-deriving working-tree status; only adds two things Git
 * Intelligence itself doesn't compute — unresolved merge-conflict markers
 * (a literal text scan, not a git operation) and a threshold judgment on
 * an already-known file count.
 */
export function scanGitIntelligence(git: GitIntelligence, files: ScannedFile[], gitDiffSummary: string | null): EngineeringFinding[] {
  const findings: EngineeringFinding[] = []

  if (git.workingTreeStatus === 'Modified') {
    findings.push({
      module: 'Git',
      category: 'Uncommitted Changes',
      severity: 'Medium',
      title: 'Uncommitted changes in the working tree',
      evidence: `Working Tree Status: Modified, ${git.filesChanged ?? 'an unknown number of'} file(s) changed.`,
      location: null,
      recommendation: 'Review and commit outstanding changes before starting new work.',
    })
  }

  if (git.filesChanged !== null && git.filesChanged >= LARGE_CHANGESET_THRESHOLD) {
    findings.push({
      module: 'Git',
      category: 'Large Change Set',
      severity: 'Medium',
      title: `${git.filesChanged} files changed in the working tree`,
      evidence: `filesChanged: ${git.filesChanged}, exceeding the ${LARGE_CHANGESET_THRESHOLD}-file threshold.`,
      location: null,
      recommendation: 'Consider splitting this change set into smaller, reviewable commits.',
    })
  }

  findings.push(...detectMergeConflictMarkers(files))

  if (gitDiffSummary) {
    findings.push({
      module: 'Git',
      category: 'Diff Summary',
      severity: 'Low',
      title: 'Working tree diff summary',
      evidence: gitDiffSummary.split('\n').slice(0, 5).join(' | '),
      location: null,
      recommendation: 'Review the diff summary before committing.',
    })
  }

  return findings
}

function detectMergeConflictMarkers(files: ScannedFile[]): EngineeringFinding[] {
  const findings: EngineeringFinding[] = []
  for (const file of files) {
    const lines = file.content.split('\n')
    const conflictLine = lines.findIndex(isConflictMarkerLine)
    if (conflictLine !== -1) {
      findings.push({
        module: 'Git',
        category: 'Merge Risk',
        severity: 'Critical',
        title: `Unresolved merge conflict marker in ${file.relativePath}`,
        evidence: `Line ${conflictLine + 1}: ${lines[conflictLine].trim()}`,
        location: `${file.relativePath}:${conflictLine + 1}`,
        recommendation: `Resolve the merge conflict in ${file.relativePath} before continuing.`,
      })
    }
  }
  return findings
}

import lastValidation from './lastValidation.json'

const UNKNOWN = 'Unknown'
const UNAVAILABLE = 'Unavailable'

export type BuildValidationStatus = 'Passing' | 'Failing' | typeof UNKNOWN
export type BuildReadiness = 'Ready' | 'Needs Review' | 'Blocked'
export type BuildConfidence = 'High' | 'Medium' | 'Low' | typeof UNKNOWN

/**
 * The three states the mission's Review Package must show for Build:
 * PASS (exit 0, no warnings), PASS (Warnings) (exit 0, warnings present),
 * FAILED (non-zero exit / compile / typecheck failure). Warnings never
 * downgrade PASS to FAILED — only the exit code does that.
 */
export type BuildResultDisplay = 'PASS' | 'PASS (Warnings)' | 'FAILED' | typeof UNKNOWN

export type BuildIntelligence = {
  buildAvailable: boolean
  lastBuildStatus: BuildValidationStatus
  lastTypeScriptStatus: BuildValidationStatus
  buildWarningCount: number
  buildResultDisplay: BuildResultDisplay
  buildTimestamp: string
  buildEnvironment: string
  buildReadiness: BuildReadiness
  buildConfidence: BuildConfidence
}

export function getBuildResultDisplay(status: BuildValidationStatus, warningCount: number): BuildResultDisplay {
  if (status === UNKNOWN) return UNKNOWN
  if (status === 'Failing') return 'FAILED'
  return warningCount > 0 ? 'PASS (Warnings)' : 'PASS'
}

function normalizeStatus(value: unknown): BuildValidationStatus {
  if (value === 'passing') return 'Passing'
  if (value === 'failing') return 'Failing'
  return UNKNOWN
}

function computeBuildReadiness(build: BuildValidationStatus, typescript: BuildValidationStatus): BuildReadiness {
  if (build === 'Failing' || typescript === 'Failing') return 'Blocked'
  if (build === UNKNOWN || typescript === UNKNOWN) return 'Needs Review'
  return 'Ready'
}

/**
 * Confidence reflects how much the last recorded result can still be
 * trusted to describe the current codebase — purely a function of how
 * long ago it was checked, not whether it passed (that's buildReadiness's
 * job). A week-old "Passing" result deserves less trust than a
 * ten-minute-old one, even though both are nominally green.
 */
function computeBuildConfidence(timestamp: string): BuildConfidence {
  if (!timestamp || timestamp === UNAVAILABLE) return UNKNOWN
  const checkedAtMs = new Date(timestamp).getTime()
  if (Number.isNaN(checkedAtMs)) return UNKNOWN
  const elapsedMs = Date.now() - checkedAtMs
  if (elapsedMs < 0) return UNKNOWN
  const DAY = 24 * 60 * 60 * 1000
  if (elapsedMs < DAY) return 'High'
  if (elapsedMs < 7 * DAY) return 'Medium'
  return 'Low'
}

/**
 * The Build Intelligence Engine — pure, deterministic, stateless,
 * read-only. Reports only what the last recorded validation run
 * (lastValidation.json, the same static record systemInfo.ts already
 * reads) captured. Never runs `npm run build`, `npx tsc`, `npm install`,
 * or any package command — it only interprets an already-recorded
 * result, never produces a new one. Anything not safely knowable from
 * that record degrades to "Unknown" / "Unavailable" rather than being
 * guessed.
 *
 * Self-contained (no context parameters needed, unlike Deployment
 * Intelligence) — Build/TypeScript status are this engine's own domain,
 * not signals borrowed from elsewhere.
 */
export function getBuildIntelligence(): BuildIntelligence {
  const lastBuildStatus = normalizeStatus(lastValidation.build)
  const lastTypeScriptStatus = normalizeStatus(lastValidation.typescript)
  const buildWarningCount = typeof lastValidation.buildWarningCount === 'number' ? lastValidation.buildWarningCount : 0
  const buildTimestamp = lastValidation.checkedAt || UNAVAILABLE
  const buildAvailable = lastBuildStatus !== UNKNOWN || lastTypeScriptStatus !== UNKNOWN

  return {
    buildAvailable,
    lastBuildStatus,
    lastTypeScriptStatus,
    buildWarningCount,
    buildResultDisplay: getBuildResultDisplay(lastBuildStatus, buildWarningCount),
    buildTimestamp,
    buildEnvironment: process.env.NODE_ENV ?? UNKNOWN,
    buildReadiness: computeBuildReadiness(lastBuildStatus, lastTypeScriptStatus),
    buildConfidence: computeBuildConfidence(buildTimestamp),
  }
}

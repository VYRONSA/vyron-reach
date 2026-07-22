import fs from 'fs'
import path from 'path'

const UNAVAILABLE = 'Unavailable'
const UNKNOWN = 'Unknown'
const NOT_CONFIGURED = 'Not Configured'

export type DeploymentEnvironment = 'Production' | 'Preview' | 'Development' | typeof UNKNOWN | typeof NOT_CONFIGURED
export type DeploymentReadiness = 'Ready' | 'Needs Review' | 'Blocked'

export type DeploymentIntelligence = {
  deploymentAvailable: boolean
  environment: DeploymentEnvironment
  productionUrl: string
  previewUrl: string
  localUrl: string
  lastDeploymentStatus: string
  lastDeploymentTime: string
  deploymentReadiness: DeploymentReadiness
}

/**
 * Signals borrowed from the engines that already computed them (Build/
 * TypeScript status from lastValidation.json via systemInfo.ts, Git
 * Readiness from gitIntelligence.ts) so Deployment Readiness never
 * re-derives them itself — same "pass already-computed values in"
 * principle every other engine in VYRON DEV follows.
 */
export type DeploymentIntelligenceContext = {
  buildStatus?: string
  typescriptStatus?: string
  gitReadiness?: 'Clean' | 'Modified' | 'Unknown'
}

/**
 * A deployment is "configured" if this code is currently running inside
 * a Vercel deployment (VERCEL_ENV is injected automatically at build/
 * runtime by Vercel — reading it is not calling an API) or if the
 * project has been linked locally (.vercel/project.json from `vercel
 * link`) or carries an explicit vercel.json. Filesystem + env var reads
 * only — no network calls, no Vercel CLI, no shelling out.
 */
/**
 * Parameterized (root defaults to process.cwd()) so callers that need to
 * check a different directory — e.g. lib/dev/director/releaseManagement/'s
 * applicability check running against an isolated test fixture rather
 * than the real repo — can do so without this module ever reading
 * process.cwd() implicitly on their behalf. The default preserves this
 * function's original behavior for its existing caller below.
 */
export function isDeploymentConfigured(root: string = /*turbopackIgnore: true*/ process.cwd()): boolean {
  if (process.env.VERCEL_ENV) return true
  try {
    if (fs.existsSync(path.join(root, '.vercel', 'project.json'))) return true
    if (fs.existsSync(path.join(root, 'vercel.json'))) return true
  } catch {
    return false
  }
  return false
}

function getEnvironment(configured: boolean): DeploymentEnvironment {
  const vercelEnv = process.env.VERCEL_ENV
  if (vercelEnv === 'production') return 'Production'
  if (vercelEnv === 'preview') return 'Preview'
  if (vercelEnv === 'development') return 'Development'
  return configured ? UNKNOWN : NOT_CONFIGURED
}

function getProductionUrl(configured: boolean): string {
  const url = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (url) return `https://${url}`
  return configured ? UNAVAILABLE : NOT_CONFIGURED
}

function getPreviewUrl(configured: boolean): string {
  if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return configured ? UNAVAILABLE : NOT_CONFIGURED
}

/**
 * Always resolvable — this is just the conventional address for the
 * locally running dev server, not a claim about live infrastructure.
 */
function getLocalUrl(): string {
  const port = process.env.PORT || '3000'
  return `http://localhost:${port}`
}

function computeDeploymentReadiness(input: {
  buildStatus: string
  typescriptStatus: string
  gitReadiness: string
  deploymentAvailable: boolean
}): DeploymentReadiness {
  if (input.buildStatus === 'Failing' || input.typescriptStatus === 'Failing') return 'Blocked'
  if (input.gitReadiness === 'Modified') return 'Needs Review'
  if (!input.deploymentAvailable) return 'Needs Review'
  return 'Ready'
}

/**
 * The Deployment Intelligence Engine — pure, deterministic, stateless,
 * read-only. Reports only what's already known from environment
 * variables Vercel injects automatically and local deployment-config
 * files. Never calls the Vercel API, never triggers a deployment, never
 * modifies deployment configuration, never runs a shell command. Last
 * deployment status/time genuinely cannot be known without the Vercel
 * API, so they always degrade to Unknown/Unavailable rather than being
 * guessed. Anything else not safely determinable degrades to
 * "Unavailable" / "Unknown" / "Not Configured".
 *
 * Server-only in effect (VERCEL_* env vars aren't exposed to the client
 * bundle) — call from a Server Component and pass the result down as a
 * plain prop, same as gitIntelligence.ts. Future batches (deployment
 * recommendations, etc.) should consume this engine's output rather
 * than reading env/fs themselves.
 */
export function getDeploymentIntelligence(context: DeploymentIntelligenceContext = {}): DeploymentIntelligence {
  const deploymentAvailable = isDeploymentConfigured()

  const deploymentReadiness = computeDeploymentReadiness({
    buildStatus: context.buildStatus ?? UNKNOWN,
    typescriptStatus: context.typescriptStatus ?? UNKNOWN,
    gitReadiness: context.gitReadiness ?? UNKNOWN,
    deploymentAvailable,
  })

  return {
    deploymentAvailable,
    environment: getEnvironment(deploymentAvailable),
    productionUrl: getProductionUrl(deploymentAvailable),
    previewUrl: getPreviewUrl(deploymentAvailable),
    localUrl: getLocalUrl(),
    lastDeploymentStatus: UNKNOWN,
    lastDeploymentTime: UNAVAILABLE,
    deploymentReadiness,
  }
}

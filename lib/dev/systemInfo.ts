import fs from 'fs'
import path from 'path'
import pkg from '@/package.json'
import { getGitInfo } from './gitInfo'
import { getBuildIntelligence } from './buildIntelligence'
import lastValidation from './lastValidation.json'

const UNAVAILABLE = 'Unavailable'

export const DEV_PORTAL_VERSION = 'v1.0 (Phase 2)'

function countRoutes(): number | typeof UNAVAILABLE {
  try {
    const appDir = path.join(/*turbopackIgnore: true*/ process.cwd(), 'app')
    let count = 0
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          walk(full)
        } else if (/^(page|route)\.(tsx?|jsx?)$/.test(entry.name)) {
          count += 1
        }
      }
    }
    walk(appDir)
    return count
  } catch {
    return UNAVAILABLE
  }
}

function getBuildTime(): string {
  try {
    const buildIdPath = path.join(/*turbopackIgnore: true*/ process.cwd(), '.next', 'BUILD_ID')
    if (!fs.existsSync(buildIdPath)) return UNAVAILABLE
    return fs.statSync(buildIdPath).mtime.toISOString()
  } catch {
    return UNAVAILABLE
  }
}

export type SystemInfo = {
  appVersion: string
  nodeVersion: string
  environment: string
  buildTime: string
  routeCount: number | string
  devPortalVersion: string
  git: ReturnType<typeof getGitInfo>
  typescriptStatus: string
  buildStatus: string
  lastValidatedAt: string
  now: string
}

export function getSystemInfo(): SystemInfo {
  const build = getBuildIntelligence()
  return {
    appVersion: pkg.version,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV ?? UNAVAILABLE,
    buildTime: getBuildTime(),
    routeCount: countRoutes(),
    devPortalVersion: DEV_PORTAL_VERSION,
    git: getGitInfo(),
    typescriptStatus: build.lastTypeScriptStatus,
    buildStatus: build.lastBuildStatus,
    lastValidatedAt: lastValidation.checkedAt,
    now: new Date().toISOString(),
  }
}

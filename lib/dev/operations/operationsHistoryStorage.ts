import fs from 'node:fs'
import path from 'node:path'
import type { OperationsSnapshot } from './operationsTypes'

/**
 * Server-side, file-backed history of Operations Snapshots — the same
 * pattern runtimeStorage.ts already established for job records. Exists
 * so the Executive Operations Dashboard's trend fields (Engineering
 * Trend, Technical Debt Trend, Risk Trend) have real history to compare
 * against instead of a single point-in-time value.
 */
const STORE_DIR = path.join(process.cwd(), '.vyron-dev')
const STORE_FILE = path.join(STORE_DIR, 'operations-history.json')
const MAX_HISTORY = 200

function ensureStore(): void {
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true })
  if (!fs.existsSync(STORE_FILE)) fs.writeFileSync(STORE_FILE, '[]', 'utf-8')
}

export function readOperationsHistory(projectSlug?: string): OperationsSnapshot[] {
  ensureStore()
  let history: OperationsSnapshot[]
  try {
    history = JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8')) as OperationsSnapshot[]
  } catch {
    return []
  }
  return projectSlug ? history.filter(h => h.projectSlug === projectSlug) : history
}

export function appendOperationsSnapshot(snapshot: OperationsSnapshot): void {
  ensureStore()
  const history = readOperationsHistory()
  history.unshift(snapshot)
  fs.writeFileSync(STORE_FILE, JSON.stringify(history.slice(0, MAX_HISTORY), null, 2), 'utf-8')
}

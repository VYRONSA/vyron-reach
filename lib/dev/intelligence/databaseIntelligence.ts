import fs from 'node:fs'
import path from 'node:path'
import type { EngineeringFinding } from './types'

const NUMBERED_MIGRATION_PATTERN = /^\d{4,}[-_]/

/**
 * Server-only. This repo has no formal migrations directory or migration-
 * tracking table — just loose .sql files under supabase/. Given that,
 * "pending migrations" and "migration ordering issues" collapse to one
 * honest observation: whether the SQL files follow a sortable naming
 * convention at all, not a comparison against a real migration ledger
 * this app has no access to. "Schema drift" requires live database
 * introspection this engine deliberately doesn't perform (no DB
 * credentials belong in an automated detection pipeline) — it always
 * reports as not implemented rather than a fabricated guess.
 */
export function scanDatabaseIntelligence(hasSqlDocumentation: boolean): EngineeringFinding[] {
  const findings: EngineeringFinding[] = []
  const sqlDir = path.join(process.cwd(), 'supabase')

  let sqlFiles: string[] = []
  try {
    sqlFiles = fs.readdirSync(sqlDir).filter(f => f.endsWith('.sql'))
  } catch {
    return findings
  }

  if (sqlFiles.length === 0) return findings

  const numbered = sqlFiles.filter(f => NUMBERED_MIGRATION_PATTERN.test(f))
  if (numbered.length === 0) {
    findings.push({
      module: 'Database',
      category: 'Migration Ordering',
      severity: 'Low',
      title: `${sqlFiles.length} SQL file(s) with no sortable ordering convention`,
      evidence: `supabase/ contains: ${sqlFiles.join(', ')} — none follow a numbered/timestamped naming convention.`,
      location: 'supabase/',
      recommendation: 'Adopt a numbered or timestamped naming convention so SQL files have an unambiguous apply order.',
    })
  }

  if (!hasSqlDocumentation) {
    findings.push({
      module: 'Database',
      category: 'Missing Database Documentation',
      severity: 'Low',
      title: 'No SQL documentation recorded',
      evidence: `${sqlFiles.length} SQL file(s) exist under supabase/, but the SQL knowledge base note is empty.`,
      location: 'supabase/',
      recommendation: 'Document the schema and its SQL files in the Knowledge Base (SQL section).',
    })
  }

  return findings
}

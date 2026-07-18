import type { TechnicalDebt } from '../technicalDebtStorage'
import type { EngineeringFinding } from './types'

const SEVERITY_BY_PRIORITY: Record<TechnicalDebt['priority'], EngineeringFinding['severity']> = {
  High: 'High',
  Medium: 'Medium',
  Low: 'Low',
}

/**
 * Client-side. Technical debt already has real, user-entered priority and
 * estimatedEffort fields — this module surfaces them as findings rather
 * than computing a new severity/effort estimate of its own, which would
 * duplicate a judgment a human already made when logging the debt.
 */
export function scanTechnicalDebtIntelligence(debt: TechnicalDebt[]): EngineeringFinding[] {
  return debt
    .filter(d => d.status !== 'Resolved')
    .map(d => ({
      module: 'Technical Debt' as const,
      category: 'Outstanding Debt',
      severity: SEVERITY_BY_PRIORITY[d.priority],
      title: d.title,
      evidence: `Priority: ${d.priority}, Status: ${d.status}${d.estimatedEffort ? `, Estimated effort: ${d.estimatedEffort}` : ''}.`,
      location: `/dev/technical-debt?focus=${d.id}`,
      recommendation: d.estimatedEffort
        ? `Resolve "${d.title}" (estimated effort: ${d.estimatedEffort}).`
        : `Resolve "${d.title}" — no effort estimate recorded.`,
    }))
}

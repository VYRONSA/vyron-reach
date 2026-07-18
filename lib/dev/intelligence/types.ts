export type FindingSeverity = 'Critical' | 'High' | 'Medium' | 'Low'

export type EngineeringModule =
  | 'Code'
  | 'Build'
  | 'Git'
  | 'Database'
  | 'Product'
  | 'Documentation'
  | 'Technical Debt'
  | 'Runtime'
  | 'Quality'

/**
 * One engineering finding. `evidence` is mandatory and must always be the
 * literal observed fact (a count, a file path, a timestamp, a matched
 * pattern) — never a paraphrase or a judgment call standing in for
 * evidence. A module that finds nothing returns an empty array; it never
 * emits a finding to "have something to say."
 */
export type EngineeringFinding = {
  module: EngineeringModule
  category: string
  severity: FindingSeverity
  title: string
  evidence: string
  location: string | null
  recommendation: string
}

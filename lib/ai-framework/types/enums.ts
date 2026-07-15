export const VAIOS_PRODUCTS = [
  'vyron-reach',
  'vyron-cost',
  'vyron-core',
  'vyron-safe',
  'vyron-farm',
  'child-compass',
] as const

export type VaiosProduct = (typeof VAIOS_PRODUCTS)[number]

export const GOVERNANCE_DECISION_CATEGORIES = [
  'architecture',
  'technical',
  'business',
  'security',
  'compliance',
  'product',
  'operational',
] as const

export type GovernanceDecisionCategory =
  (typeof GOVERNANCE_DECISION_CATEGORIES)[number]

export const EVENT_SECURITY_CLASSIFICATIONS = [
  'public',
  'internal',
  'restricted',
  'confidential',
] as const

export type EventSecurityClassification =
  (typeof EVENT_SECURITY_CLASSIFICATIONS)[number]

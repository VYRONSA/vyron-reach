export const VAIOS_EVENT_DOMAINS = [
  'lifecycle',
  'reasoning',
  'generation',
  'validation',
  'workflow',
  'security',
  'audit',
  'cost',
  'learning',
  'domain-pack',
  'control-plane',
] as const

export type VaiosEventDomain = (typeof VAIOS_EVENT_DOMAINS)[number]

export interface EventNameParts {
  domain: VaiosEventDomain
  entity: string
  action: string
  version: string
}

export const EVENT_NAMING_PATTERN =
  '<domain>.<entity>.<action>.<version>'

import type { Metadata, Severity } from '@/lib/ai-framework/types/base'

export const VAIOS_ERROR_DOMAINS = [
  'config',
  'security',
  'provider',
  'workflow',
  'reasoning',
  'validation',
  'memory',
  'assets',
  'events',
  'governance',
  'domain-pack',
  'testing',
] as const

export type VaiosErrorDomain = (typeof VAIOS_ERROR_DOMAINS)[number]

export const VAIOS_ERROR_CODES = {
  CONFIG_INVALID: 'VAIOS_CONFIG_INVALID',
  SECURITY_FORBIDDEN: 'VAIOS_SECURITY_FORBIDDEN',
  TENANT_ISOLATION_BREACH: 'VAIOS_TENANT_ISOLATION_BREACH',
  PROVIDER_UNAVAILABLE: 'VAIOS_PROVIDER_UNAVAILABLE',
  WORKFLOW_TRANSITION_INVALID: 'VAIOS_WORKFLOW_TRANSITION_INVALID',
  REASONING_INCOMPLETE: 'VAIOS_REASONING_INCOMPLETE',
  VALIDATION_FAILED: 'VAIOS_VALIDATION_FAILED',
  MEMORY_ACCESS_DENIED: 'VAIOS_MEMORY_ACCESS_DENIED',
  EVENT_ENVELOPE_INVALID: 'VAIOS_EVENT_ENVELOPE_INVALID',
  DOMAIN_PACK_INCOMPATIBLE: 'VAIOS_DOMAIN_PACK_INCOMPATIBLE',
  TEST_GATE_FAILED: 'VAIOS_TEST_GATE_FAILED',
} as const

export type VaiosErrorCode =
  (typeof VAIOS_ERROR_CODES)[keyof typeof VAIOS_ERROR_CODES]

export interface VaiosError {
  code: VaiosErrorCode
  domain: VaiosErrorDomain
  message: string
  severity: Severity
  retryable: boolean
  details?: Metadata
  cause?: string
}

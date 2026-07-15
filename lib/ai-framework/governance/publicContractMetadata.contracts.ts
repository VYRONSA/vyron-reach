import type { IsoDateTime, VersionString } from '@/lib/ai-framework/types/base'

export const CONTRACT_STABILITY_LEVELS = [
  'experimental',
  'internal',
  'stable',
  'frozen',
  'deprecated',
] as const

export type ContractStabilityLevel = (typeof CONTRACT_STABILITY_LEVELS)[number]

export interface PublicContractMetadata {
  contractId: string
  contractPath: string
  owner: string
  responsibility: string
  primaryConsumers: string[]
  dependencies: string[]
  stabilityLevel: ContractStabilityLevel
  version: VersionString
  reviewFrequencyDays: number
  lastReviewedAt?: IsoDateTime
}

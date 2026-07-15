import type { IsoDateTime, Metadata } from '@/lib/ai-framework/types/base'
import type { SkillRegistrationInput } from './validation'

export type SkillCategory =
  | 'orchestration'
  | 'reasoning-support'
  | 'transformation'
  | 'classification'
  | 'evaluation'
  | 'planning'
  | 'retrieval'
  | 'utility'
  | 'other'

export interface SkillCapabilityDeclaration {
  capabilityId: string
  name: string
  declared: boolean
  metadata?: Metadata
}

export interface SkillMetadata {
  skillId: string
  name: string
  category: SkillCategory | string
  version: string
  contractVersion: string
  dependencies: string[]
  capabilities: SkillCapabilityDeclaration[]
  metadata?: Metadata
}

export interface SkillContract {
  readonly metadata: SkillMetadata
}

export interface SkillRegistration extends SkillRegistrationInput {
  registeredAt: IsoDateTime
}

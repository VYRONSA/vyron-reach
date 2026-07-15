import type { IsoDateTime, Metadata } from '@/lib/ai-framework/types/base'
import type { ProviderRegistrationInput } from './validation'

export type ProviderType = 'ai' | 'chat' | 'embedding' | 'image' | 'speech' | 'moderation'
export type ProviderAvailabilityStatus = 'available' | 'degraded' | 'unavailable' | 'maintenance'

export interface ProviderCapabilityMetadata {
  capabilityId: string
  name: string
  supported: boolean
  metadata?: Metadata
}

export interface ProviderVersionMetadata {
  providerVersion: string
  contractVersion: string
}

export interface ProviderHealthSnapshot {
  status: ProviderAvailabilityStatus
  message: string
  checkedAt: IsoDateTime
  details?: Metadata
}

export interface ProviderContractMetadata {
  providerId: string
  name: string
  type: ProviderType
  version: ProviderVersionMetadata
  capabilities: ProviderCapabilityMetadata[]
  availability: ProviderAvailabilityStatus
  metadata?: Metadata
}

export interface AIProviderRequest {
  prompt: string
  metadata?: Metadata
}

export interface AIProviderResponse {
  output: string
  metadata?: Metadata
}

export interface ChatProviderRequest {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  metadata?: Metadata
}

export interface ChatProviderResponse {
  message: string
  metadata?: Metadata
}

export interface EmbeddingProviderRequest {
  input: string[]
  metadata?: Metadata
}

export interface EmbeddingProviderResponse {
  vectors: number[][]
  metadata?: Metadata
}

export interface ImageProviderRequest {
  prompt: string
  metadata?: Metadata
}

export interface ImageProviderResponse {
  images: Array<{ mimeType: string; data: string }>
  metadata?: Metadata
}

export interface SpeechProviderRequest {
  input: string
  mode: 'synthesis' | 'transcription'
  metadata?: Metadata
}

export interface SpeechProviderResponse {
  output: string
  metadata?: Metadata
}

export interface ModerationProviderRequest {
  input: string
  metadata?: Metadata
}

export interface ModerationProviderResponse {
  flagged: boolean
  categories: string[]
  metadata?: Metadata
}

export interface BaseProviderContract {
  readonly metadata: ProviderContractMetadata
}

export interface AIProvider extends BaseProviderContract {
  generate(request: AIProviderRequest): Promise<AIProviderResponse>
}

export interface ChatProvider extends BaseProviderContract {
  chat(request: ChatProviderRequest): Promise<ChatProviderResponse>
}

export interface EmbeddingProvider extends BaseProviderContract {
  embed(request: EmbeddingProviderRequest): Promise<EmbeddingProviderResponse>
}

export interface ImageProvider extends BaseProviderContract {
  render(request: ImageProviderRequest): Promise<ImageProviderResponse>
}

export interface SpeechProvider extends BaseProviderContract {
  process(request: SpeechProviderRequest): Promise<SpeechProviderResponse>
}

export interface ModerationProvider extends BaseProviderContract {
  moderate(request: ModerationProviderRequest): Promise<ModerationProviderResponse>
}

export interface ProviderRegistration extends ProviderRegistrationInput {
  registeredAt: IsoDateTime
  availability: ProviderAvailabilityStatus
  health: ProviderHealthSnapshot
}

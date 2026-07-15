import type { EventEnvelope } from '@/lib/ai-framework/events/envelope'
import type { VaiosError } from '@/lib/ai-framework/errors/taxonomy'

export interface ExecutionResult<TData extends object> {
  ok: boolean
  data?: TData
  error?: VaiosError
}

export interface AIProviderContract {
  providerId: string
  execute(request: object): Promise<ExecutionResult<object>>
  healthCheck(): Promise<ExecutionResult<{ status: 'up' | 'degraded' | 'down' }>>
}

export interface ContextProviderContract {
  sourceId: string
  collect(input: object): Promise<ExecutionResult<object>>
}

export interface MemoryProviderContract {
  memoryId: string
  retrieve(input: object): Promise<ExecutionResult<object>>
  persist(input: object): Promise<ExecutionResult<{ stored: true }>>
}

export interface SkillProviderContract {
  skillKey: string
  execute(input: object): Promise<ExecutionResult<object>>
}

export interface WorkflowProviderContract {
  workflowId: string
  transition(input: object): Promise<ExecutionResult<{ state: string }>>
}

export interface ValidationProviderContract {
  validatorId: string
  validate(input: object): Promise<ExecutionResult<{ passed: boolean; issues: string[] }>>
}

export interface AssetProviderContract {
  assetProviderId: string
  resolve(input: object): Promise<ExecutionResult<object>>
}

export interface ReasoningProviderContract {
  reasoningId: string
  reason(input: object): Promise<ExecutionResult<object>>
}

export interface TelemetryProviderContract {
  telemetryId: string
  emit(event: EventEnvelope<object>): Promise<ExecutionResult<{ accepted: true }>>
}

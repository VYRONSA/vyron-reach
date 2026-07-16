import type { ValidationStatus } from './handoverStorage'

export type DevelopmentCompletionStatus = 'Development Complete' | 'Further Work Required'

/** The subset of a parsed report / stored Handover this determination actually reads. */
export type CompletionSignal = {
  buildStatus: ValidationStatus
  typescriptStatus: ValidationStatus
  runtimeStatus: ValidationStatus
  nextSuggestedBatch: string
}

/**
 * Shared by the Development Completion Engine (evaluating a freshly parsed
 * report) and the Development Conversation Memory Engine (evaluating a
 * previously stored Handover, which has the same field shape). Lives in its
 * own file so neither engine has to import the other to reuse this
 * determination — avoids a circular dependency between them.
 *
 * Failing build/TypeScript/runtime, or an explicit next-batch suggestion,
 * are the only signals treated as "further work required" — the same
 * build/typescript-first severity ordering already used by
 * computeDevelopmentReadiness and deriveExecutiveDecision. Risks or
 * recommendations being present doesn't by itself reopen work that
 * otherwise validated clean.
 */
export function determineCompletionStatus(signal: CompletionSignal): { status: DevelopmentCompletionStatus; reasons: string[] } {
  const reasons: string[] = []
  if (signal.buildStatus === 'Failing') reasons.push('Build is failing.')
  if (signal.typescriptStatus === 'Failing') reasons.push('TypeScript is failing.')
  if (signal.runtimeStatus === 'Failing') reasons.push('Runtime status reported as failing.')
  if (signal.nextSuggestedBatch !== '') reasons.push(`A next batch was suggested: ${signal.nextSuggestedBatch}`)
  return { status: reasons.length > 0 ? 'Further Work Required' : 'Development Complete', reasons }
}

/**
 * The configurable retry policy every provider's delivery attempts share
 * — exponential backoff with a maximum retry count and a delay cap, plus
 * explicit permanent-vs-transient failure classification.
 *
 * Classification is deliberately explicit at the source (transports
 * throw a DeliveryError with a known `kind`) rather than guessed later
 * from an error message via regex, which would be fragile — an SMTP 5xx
 * or an HTTP 4xx (other than 429) is a fact the transport already knows
 * for certain, not something worth re-deriving downstream.
 */

export type DeliveryFailureKind = 'Transient' | 'Permanent'

export class DeliveryError extends Error {
  readonly kind: DeliveryFailureKind
  constructor(message: string, kind: DeliveryFailureKind) {
    super(message)
    this.name = 'DeliveryError'
    this.kind = kind
  }
}

export const DEFAULT_MAX_ATTEMPTS = 5
const BASE_DELAY_MS = 1000
const MAX_DELAY_MS = 5 * 60 * 1000 // 5 minutes — a retry storm must never grow unbounded

/** `attempt` is 1-indexed — the attempt about to be made. Pure: same attempt number always yields the same delay. */
export function computeBackoffDelayMs(attempt: number): number {
  const exponential = BASE_DELAY_MS * Math.pow(2, Math.max(0, attempt - 1))
  return Math.min(exponential, MAX_DELAY_MS)
}

/** An error a transport didn't explicitly classify is treated as Transient by default — safer to retry (bounded by maxAttempts) than to give up on an unrecognized failure too eagerly. */
export function classifyError(err: unknown): { kind: DeliveryFailureKind; message: string } {
  if (err instanceof DeliveryError) return { kind: err.kind, message: err.message }
  if (err instanceof Error) return { kind: 'Transient', message: err.message }
  return { kind: 'Transient', message: String(err) }
}

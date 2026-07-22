/**
 * PRA-P1-014 remediation — a short server-side debounce shared by every
 * governance decision submission that does NOT change InitiationRequest
 * status (Risk Gate's Accept Risk, and both Executive Go/Hold decision
 * types). Those are exactly the decision types with no natural
 * protection against a double-click or a retried request: a decision
 * that DOES transition status (Mitigate Risk / Reject Programme) is
 * already protected by that transition's own CAS — a second, near-
 * identical submission simply finds the record no longer in the
 * required source status and is rejected on its own. Client-side, the
 * relevant submit buttons already disable themselves while a request is
 * in flight (InitiationRiskGatePanel.tsx, InitiationExecutiveControlPanel.tsx)
 * — this is the second, server-side layer for a retried request or a
 * genuinely separate double-click race the client-side disable can't
 * always catch.
 *
 * Not a new persistence mechanism and not a new validation concept: it
 * only reads decisions the caller already fetched from the existing
 * store (never a second, parallel dedup store), and only ever prevents
 * writing an identical decision again — it can never block a genuinely
 * different decision, at any time, for any reason.
 */

const DEBOUNCE_WINDOW_MS = 5000

/**
 * True when `latest` records the same decision (per `isSameDecision`)
 * and was decided within the last few seconds — i.e. this submission is
 * almost certainly a double-click or a retried request replaying the one
 * that already succeeded, not a genuine new decision.
 */
export function isDuplicateDecision<T extends { decidedAt: string }>(
  latest: T | undefined,
  isSameDecision: (d: T) => boolean,
  now: number = Date.now()
): latest is T {
  if (!latest || !isSameDecision(latest)) return false
  return now - new Date(latest.decidedAt).getTime() < DEBOUNCE_WINDOW_MS
}

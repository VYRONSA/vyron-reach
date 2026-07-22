import { DeliveryError } from '../../retryPolicy'
import type { ResendConfig } from '../../providerConfig'
import type { EmailContent } from './emailContent'

const RESEND_API_URL = 'https://api.resend.com/emails'

/** HTTP convention (the normal one, unlike SMTP): 5xx and 429 are worth retrying, any other 4xx (bad request, invalid recipient, auth failure) is not. */
function classifyHttpStatus(status: number): 'Transient' | 'Permanent' {
  return status >= 500 || status === 429 ? 'Transient' : 'Permanent'
}

/**
 * PRA-P1-034 remediation — `idempotencyKey` should be the NotificationEvent's
 * own `id` (stable across every retry and across a post-crash resume, since
 * it's generated once at raiseNotification time and persisted as part of the
 * delivery record itself, never regenerated). Resend deduplicates repeated
 * requests carrying the same key within a 24h window, so if a crash happens
 * between this call actually succeeding and this delivery's status being
 * persisted as Delivered (the exact gap deliveryBootstrap.ts's own doc
 * comment describes), the resumed retry reaches Resend again but is
 * recognized as the same send rather than emailing the recipient twice.
 */
export async function sendViaResend(config: ResendConfig, recipient: string, content: EmailContent, idempotencyKey: string): Promise<void> {
  let response: Response
  try {
    response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        from: config.from,
        to: [recipient],
        subject: content.subject,
        text: content.text,
        html: content.html,
      }),
    })
  } catch (err) {
    // Network-level failure (DNS, timeout, connection reset) — always transient.
    throw new DeliveryError(`Resend request failed: ${err instanceof Error ? err.message : String(err)}`, 'Transient')
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new DeliveryError(`Resend API error ${response.status}: ${body}`, classifyHttpStatus(response.status))
  }
}

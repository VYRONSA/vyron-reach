import { DeliveryError } from '../../retryPolicy'
import type { TwilioWhatsAppConfig } from '../../providerConfig'

function classifyHttpStatus(status: number): 'Transient' | 'Permanent' {
  return status >= 500 || status === 429 ? 'Transient' : 'Permanent'
}

/**
 * Twilio's REST API is plain HTTP with HTTP Basic Auth — called directly
 * via fetch, no SDK dependency needed.
 *
 * PRA-P1-034 — same accepted "prefer duplicate over lost" tradeoff as
 * metaCloudApiTransport.ts: this codebase does not send a Twilio
 * idempotency key here, so a crash between this call succeeding and this
 * delivery's status being persisted can cause a resumed retry to send the
 * same message twice. See deliveryBootstrap.ts's doc comment.
 */
export async function sendViaTwilio(config: TwilioWhatsAppConfig, recipient: string, message: string): Promise<void> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`
  const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')
  const body = new URLSearchParams({
    From: `whatsapp:${config.fromNumber}`,
    To: `whatsapp:${recipient}`,
    Body: message,
  })

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })
  } catch (err) {
    throw new DeliveryError(`Twilio WhatsApp request failed: ${err instanceof Error ? err.message : String(err)}`, 'Transient')
  }

  if (!response.ok) {
    const responseBody = await response.text().catch(() => '')
    throw new DeliveryError(`Twilio WhatsApp API error ${response.status}: ${responseBody}`, classifyHttpStatus(response.status))
  }
}

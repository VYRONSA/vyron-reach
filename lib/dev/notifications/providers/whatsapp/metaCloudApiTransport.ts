import { DeliveryError } from '../../retryPolicy'
import type { MetaWhatsAppConfig } from '../../providerConfig'

function classifyHttpStatus(status: number): 'Transient' | 'Permanent' {
  return status >= 500 || status === 429 ? 'Transient' : 'Permanent'
}

/**
 * PRA-P1-034 — unlike Resend (see resendTransport.ts), the Cloud API's
 * `/messages` endpoint has no documented request-level idempotency key for
 * a freeform text send, so this transport carries the same accepted "prefer
 * duplicate over lost" tradeoff deliveryBootstrap.ts's own doc comment
 * describes: a crash between this call succeeding and this delivery's
 * status being persisted can cause a resumed retry to send the same
 * message twice.
 */
export async function sendViaMetaCloudApi(config: MetaWhatsAppConfig, recipient: string, message: string): Promise<void> {
  const url = `https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'text',
        text: { body: message },
      }),
    })
  } catch (err) {
    throw new DeliveryError(`Meta WhatsApp Cloud API request failed: ${err instanceof Error ? err.message : String(err)}`, 'Transient')
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new DeliveryError(`Meta WhatsApp Cloud API error ${response.status}: ${body}`, classifyHttpStatus(response.status))
  }
}

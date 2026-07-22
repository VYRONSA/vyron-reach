import type { NotificationEvent, NotificationProvider } from '../notificationTypes'
import { getEmailProviderConfig } from '../providerConfig'
import { registerDeliveryHandler, enqueueDelivery, type DeliveryHandler } from '../deliveryQueue'
import { DeliveryError } from '../retryPolicy'
import { buildEmailContent } from './email/emailContent'
import { sendViaSmtp } from './email/smtpTransport'
import { sendViaResend } from './email/resendTransport'

const PROVIDER_NAME = 'Email'

/**
 * Production-ready — SMTP (via nodemailer) or Resend, chosen per
 * lib/dev/notifications/providerConfig.ts's EMAIL_TRANSPORT env var (or
 * whichever is configured, if only one is). Config is read fresh on
 * every attempt (never captured at enqueue time), so recovery after a
 * restart and a live retry both see the current configuration.
 */
export async function attemptEmailDelivery(event: NotificationEvent): Promise<void> {
  const config = getEmailProviderConfig()
  if (!config.enabled || !config.recipient || !config.transport) {
    throw new DeliveryError('Email provider is not configured', 'Permanent')
  }

  const content = buildEmailContent(event)

  if (config.transport === 'smtp') {
    if (!config.smtp) throw new DeliveryError('SMTP transport selected but not fully configured', 'Permanent')
    // PRA-P1-034 — raw SMTP has no server-side idempotency mechanism (no
    // provider-acknowledged request id to dedupe by, unlike Resend below),
    // so a crash between the server accepting this message and this
    // delivery's status being persisted carries a genuine, accepted "may
    // send twice" risk. Deliberate "prefer duplicate over lost" tradeoff,
    // not an oversight — see deliveryBootstrap.ts's doc comment for the
    // recovery path that can trigger this.
    await sendViaSmtp(config.smtp, config.recipient, content)
  } else {
    if (!config.resend) throw new DeliveryError('Resend transport selected but not fully configured', 'Permanent')
    // PRA-P1-034 — event.id is stable across every attempt and across a
    // post-crash resume, so Resend can recognize a retried request as the
    // same send. See resendTransport.ts's own doc comment for the full
    // reasoning.
    await sendViaResend(config.resend, config.recipient, content, event.id)
  }
}

const emailHandler: DeliveryHandler = {
  attempt: attemptEmailDelivery,
  isEnabled: () => getEmailProviderConfig().enabled,
}

registerDeliveryHandler(PROVIDER_NAME, emailHandler)

export class EmailNotificationProvider implements NotificationProvider {
  readonly name = PROVIDER_NAME

  get enabled(): boolean {
    return emailHandler.isEnabled()
  }

  /**
   * Enqueues and returns immediately — the real send happens
   * asynchronously in lib/dev/notifications/deliveryQueue.ts, fire-and-forget.
   * This is what keeps notificationService.ts's `await provider.send(event)`
   * (unchanged) from ever blocking the Director on real delivery.
   */
  async send(event: NotificationEvent): Promise<void> {
    enqueueDelivery(event, PROVIDER_NAME)
  }
}

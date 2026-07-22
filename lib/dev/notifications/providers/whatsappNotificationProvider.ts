import type { NotificationEvent, NotificationProvider } from '../notificationTypes'
import { getWhatsAppProviderConfig } from '../providerConfig'
import { registerDeliveryHandler, enqueueDelivery, type DeliveryHandler } from '../deliveryQueue'
import { DeliveryError } from '../retryPolicy'
import { buildWhatsAppMessage } from './whatsapp/whatsappContent'
import { sendViaMetaCloudApi } from './whatsapp/metaCloudApiTransport'
import { sendViaTwilio } from './whatsapp/twilioTransport'

const PROVIDER_NAME = 'WhatsApp'

/**
 * Production-ready — Meta WhatsApp Cloud API or Twilio WhatsApp, chosen
 * per lib/dev/notifications/providerConfig.ts's WHATSAPP_TRANSPORT env
 * var (or whichever is configured, if only one is). Config is read
 * fresh on every attempt, same as the Email provider.
 */
export async function attemptWhatsAppDelivery(event: NotificationEvent): Promise<void> {
  const config = getWhatsAppProviderConfig()
  if (!config.enabled || !config.recipient || !config.transport) {
    throw new DeliveryError('WhatsApp provider is not configured', 'Permanent')
  }

  const message = buildWhatsAppMessage(event)

  if (config.transport === 'meta') {
    if (!config.meta) throw new DeliveryError('Meta WhatsApp Cloud API transport selected but not fully configured', 'Permanent')
    await sendViaMetaCloudApi(config.meta, config.recipient, message)
  } else {
    if (!config.twilio) throw new DeliveryError('Twilio WhatsApp transport selected but not fully configured', 'Permanent')
    await sendViaTwilio(config.twilio, config.recipient, message)
  }
}

const whatsAppHandler: DeliveryHandler = {
  attempt: attemptWhatsAppDelivery,
  isEnabled: () => getWhatsAppProviderConfig().enabled,
}

registerDeliveryHandler(PROVIDER_NAME, whatsAppHandler)

export class WhatsAppNotificationProvider implements NotificationProvider {
  readonly name = PROVIDER_NAME

  get enabled(): boolean {
    return whatsAppHandler.isEnabled()
  }

  /** Enqueues and returns immediately — see EmailNotificationProvider's doc comment; identical contract. */
  async send(event: NotificationEvent): Promise<void> {
    enqueueDelivery(event, PROVIDER_NAME)
  }
}

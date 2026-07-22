import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, waitFor, type IsolatedDataDir } from '../support/testHarness'
import { EmailNotificationProvider, attemptEmailDelivery } from '../../../lib/dev/notifications/providers/emailNotificationProvider'
import { WhatsAppNotificationProvider, attemptWhatsAppDelivery } from '../../../lib/dev/notifications/providers/whatsappNotificationProvider'
import { listDeliveriesForProvider } from '../../../lib/dev/notifications/deliveryStore'
import type { NotificationEvent } from '../../../lib/dev/notifications/notificationTypes'

const ENV_KEYS = [
  'EMAIL_NOTIFICATIONS_ENABLED', 'EMAIL_TRANSPORT', 'NOTIFICATION_EMAIL_TO', 'RESEND_API_KEY', 'RESEND_FROM',
  'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM',
  'WHATSAPP_NOTIFICATIONS_ENABLED', 'WHATSAPP_TRANSPORT', 'NOTIFICATION_WHATSAPP_TO',
  'META_WHATSAPP_ACCESS_TOKEN', 'META_WHATSAPP_PHONE_NUMBER_ID', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_FROM',
]

let savedEnv: Record<string, string | undefined> = {}
let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
  savedEnv = {}
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key]
    delete process.env[key]
  }
})

afterEach(() => {
  isolated.cleanup()
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key]
    else process.env[key] = savedEnv[key]
  }
})

function event(project: string, overrides: Partial<NotificationEvent> = {}): NotificationEvent {
  return {
    id: `e-${Math.random().toString(36).slice(2)}`, type: 'CEO Approval Required', project, title: 'x', message: 'x',
    severity: 'High', timestamp: '2026-01-01T00:00:00.000Z', metadata: {}, ...overrides,
  }
}

describe('EmailNotificationProvider — configuration-driven enable/disable', () => {
  it('is disabled with no configuration', () => {
    expect(new EmailNotificationProvider().enabled).toBe(false)
  })

  it('becomes enabled the instant valid configuration is present — read fresh, not cached at construction', () => {
    const provider = new EmailNotificationProvider()
    expect(provider.enabled).toBe(false)
    process.env.NOTIFICATION_EMAIL_TO = 'ceo@example.com'
    process.env.RESEND_API_KEY = 'key'
    process.env.RESEND_FROM = 'noreply@example.com'
    expect(provider.enabled).toBe(true)
  })

  it('attemptEmailDelivery throws a Permanent DeliveryError when not configured — never a fabricated success', async () => {
    await expect(attemptEmailDelivery(event(uniqueSlug()))).rejects.toMatchObject({ name: 'DeliveryError', kind: 'Permanent' })
  })

  it('send() enqueues and resolves without throwing, even though the provider is unconfigured — the outcome (Cancelled, since isEnabled() is false) surfaces asynchronously in the delivery record, never synchronously from send()', async () => {
    const project = uniqueSlug()
    const provider = new EmailNotificationProvider()
    await expect(provider.send(event(project))).resolves.toBeUndefined()
    await waitFor(() => listDeliveriesForProvider('Email').some(d => d.project === project && d.status === 'Cancelled'))
  })
})

describe('WhatsAppNotificationProvider — configuration-driven enable/disable', () => {
  it('is disabled with no configuration', () => {
    expect(new WhatsAppNotificationProvider().enabled).toBe(false)
  })

  it('becomes enabled once Meta Cloud API configuration is present', () => {
    const provider = new WhatsAppNotificationProvider()
    expect(provider.enabled).toBe(false)
    process.env.NOTIFICATION_WHATSAPP_TO = '15551234567'
    process.env.META_WHATSAPP_ACCESS_TOKEN = 'token'
    process.env.META_WHATSAPP_PHONE_NUMBER_ID = '123456'
    expect(provider.enabled).toBe(true)
  })

  it('attemptWhatsAppDelivery throws a Permanent DeliveryError when not configured', async () => {
    await expect(attemptWhatsAppDelivery(event(uniqueSlug()))).rejects.toMatchObject({ name: 'DeliveryError', kind: 'Permanent' })
  })

  it('send() enqueues and resolves without throwing, even when unconfigured', async () => {
    const project = uniqueSlug()
    const provider = new WhatsAppNotificationProvider()
    await expect(provider.send(event(project))).resolves.toBeUndefined()
    await waitFor(() => listDeliveriesForProvider('WhatsApp').some(d => d.project === project && d.status === 'Cancelled'))
  })
})

describe('Both providers — independently enabled/disabled', () => {
  it('enabling Email does not enable WhatsApp, and vice versa', () => {
    process.env.NOTIFICATION_EMAIL_TO = 'ceo@example.com'
    process.env.RESEND_API_KEY = 'key'
    process.env.RESEND_FROM = 'noreply@example.com'
    expect(new EmailNotificationProvider().enabled).toBe(true)
    expect(new WhatsAppNotificationProvider().enabled).toBe(false)
  })
})

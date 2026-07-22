import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { getEmailProviderConfig, getWhatsAppProviderConfig } from '../../../lib/dev/notifications/providerConfig'

const ENV_KEYS = [
  'EMAIL_NOTIFICATIONS_ENABLED', 'EMAIL_TRANSPORT', 'NOTIFICATION_EMAIL_TO',
  'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM',
  'RESEND_API_KEY', 'RESEND_FROM',
  'WHATSAPP_NOTIFICATIONS_ENABLED', 'WHATSAPP_TRANSPORT', 'NOTIFICATION_WHATSAPP_TO',
  'META_WHATSAPP_ACCESS_TOKEN', 'META_WHATSAPP_PHONE_NUMBER_ID',
  'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_FROM',
]

let savedEnv: Record<string, string | undefined> = {}

beforeEach(() => {
  savedEnv = {}
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key]
    delete process.env[key]
  }
})

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key]
    else process.env[key] = savedEnv[key]
  }
})

describe('Provider Config — Email, disabled by default', () => {
  it('is disabled with no configuration at all', () => {
    const config = getEmailProviderConfig()
    expect(config.enabled).toBe(false)
    expect(config.transport).toBeNull()
  })

  it('stays disabled with credentials but no recipient', () => {
    process.env.RESEND_API_KEY = 'key'
    process.env.RESEND_FROM = 'noreply@example.com'
    expect(getEmailProviderConfig().enabled).toBe(false)
  })

  it('stays disabled with a recipient but no credentials', () => {
    process.env.NOTIFICATION_EMAIL_TO = 'ceo@example.com'
    expect(getEmailProviderConfig().enabled).toBe(false)
  })
})

describe('Provider Config — Email, transport selection', () => {
  it('enables Resend when fully configured', () => {
    process.env.NOTIFICATION_EMAIL_TO = 'ceo@example.com'
    process.env.RESEND_API_KEY = 'key'
    process.env.RESEND_FROM = 'noreply@example.com'
    const config = getEmailProviderConfig()
    expect(config.enabled).toBe(true)
    expect(config.transport).toBe('resend')
  })

  it('enables SMTP when fully configured', () => {
    process.env.NOTIFICATION_EMAIL_TO = 'ceo@example.com'
    process.env.SMTP_HOST = 'smtp.example.com'
    process.env.SMTP_USER = 'user'
    process.env.SMTP_PASS = 'pass'
    process.env.SMTP_FROM = 'noreply@example.com'
    const config = getEmailProviderConfig()
    expect(config.enabled).toBe(true)
    expect(config.transport).toBe('smtp')
    expect(config.smtp?.port).toBe(587) // default
  })

  it('prefers Resend over SMTP when both are configured and neither is explicitly requested', () => {
    process.env.NOTIFICATION_EMAIL_TO = 'ceo@example.com'
    process.env.RESEND_API_KEY = 'key'
    process.env.RESEND_FROM = 'noreply@example.com'
    process.env.SMTP_HOST = 'smtp.example.com'
    process.env.SMTP_USER = 'user'
    process.env.SMTP_PASS = 'pass'
    process.env.SMTP_FROM = 'noreply@example.com'
    expect(getEmailProviderConfig().transport).toBe('resend')
  })

  it('honors an explicit EMAIL_TRANSPORT request over the default preference', () => {
    process.env.NOTIFICATION_EMAIL_TO = 'ceo@example.com'
    process.env.RESEND_API_KEY = 'key'
    process.env.RESEND_FROM = 'noreply@example.com'
    process.env.SMTP_HOST = 'smtp.example.com'
    process.env.SMTP_USER = 'user'
    process.env.SMTP_PASS = 'pass'
    process.env.SMTP_FROM = 'noreply@example.com'
    process.env.EMAIL_TRANSPORT = 'smtp'
    expect(getEmailProviderConfig().transport).toBe('smtp')
  })

  it('never silently falls back to a different transport than explicitly requested', () => {
    process.env.NOTIFICATION_EMAIL_TO = 'ceo@example.com'
    process.env.SMTP_HOST = 'smtp.example.com'
    process.env.SMTP_USER = 'user'
    process.env.SMTP_PASS = 'pass'
    process.env.SMTP_FROM = 'noreply@example.com'
    process.env.EMAIL_TRANSPORT = 'resend' // requested but Resend isn't configured
    const config = getEmailProviderConfig()
    expect(config.transport).toBeNull()
    expect(config.enabled).toBe(false)
  })
})

describe('Provider Config — Email, independent enable/disable', () => {
  it('respects an explicit opt-out even when fully configured', () => {
    process.env.NOTIFICATION_EMAIL_TO = 'ceo@example.com'
    process.env.RESEND_API_KEY = 'key'
    process.env.RESEND_FROM = 'noreply@example.com'
    process.env.EMAIL_NOTIFICATIONS_ENABLED = 'false'
    expect(getEmailProviderConfig().enabled).toBe(false)
  })

  it('never leaks a secret into the "enabled" boolean or transport name', () => {
    process.env.NOTIFICATION_EMAIL_TO = 'ceo@example.com'
    process.env.RESEND_API_KEY = 'super-secret-key'
    process.env.RESEND_FROM = 'noreply@example.com'
    const config = getEmailProviderConfig()
    expect(JSON.stringify({ enabled: config.enabled, transport: config.transport })).not.toContain('super-secret-key')
  })
})

describe('Provider Config — WhatsApp, mirrors the same rules independently of Email', () => {
  it('is disabled by default and independent of the Email provider\'s own state', () => {
    process.env.NOTIFICATION_EMAIL_TO = 'ceo@example.com'
    process.env.RESEND_API_KEY = 'key'
    process.env.RESEND_FROM = 'noreply@example.com'
    expect(getEmailProviderConfig().enabled).toBe(true)
    expect(getWhatsAppProviderConfig().enabled).toBe(false)
  })

  it('enables Meta WhatsApp Cloud API when fully configured', () => {
    process.env.NOTIFICATION_WHATSAPP_TO = '15551234567'
    process.env.META_WHATSAPP_ACCESS_TOKEN = 'token'
    process.env.META_WHATSAPP_PHONE_NUMBER_ID = '123456'
    const config = getWhatsAppProviderConfig()
    expect(config.enabled).toBe(true)
    expect(config.transport).toBe('meta')
  })

  it('enables Twilio WhatsApp when fully configured', () => {
    process.env.NOTIFICATION_WHATSAPP_TO = '15551234567'
    process.env.TWILIO_ACCOUNT_SID = 'AC123'
    process.env.TWILIO_AUTH_TOKEN = 'secret'
    process.env.TWILIO_WHATSAPP_FROM = '15557654321'
    const config = getWhatsAppProviderConfig()
    expect(config.enabled).toBe(true)
    expect(config.transport).toBe('twilio')
  })

  it('respects an explicit opt-out', () => {
    process.env.NOTIFICATION_WHATSAPP_TO = '15551234567'
    process.env.TWILIO_ACCOUNT_SID = 'AC123'
    process.env.TWILIO_AUTH_TOKEN = 'secret'
    process.env.TWILIO_WHATSAPP_FROM = '15557654321'
    process.env.WHATSAPP_NOTIFICATIONS_ENABLED = 'false'
    expect(getWhatsAppProviderConfig().enabled).toBe(false)
  })
})

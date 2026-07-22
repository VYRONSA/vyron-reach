/**
 * All provider configuration is read from process.env — server-only
 * (this whole lib/dev/notifications/ subsystem has zero 'use client'
 * files and is never imported into a client bundle), so no secret ever
 * exists in browser code. Every getter here reads process.env fresh on
 * every call (never cached in a module-level constant), matching this
 * codebase's established pattern (getVyronDevDataDir, isRuntimeAccessible)
 * — a provider disabled/reconfigured via env is honored immediately, not
 * only after a process restart.
 *
 * "Providers must be independently enabled/disabled": each provider has
 * its own explicit opt-out flag (EMAIL_NOTIFICATIONS_ENABLED /
 * WHATSAPP_NOTIFICATIONS_ENABLED), separate from whether its credentials
 * happen to be present — `enabled` is only true when BOTH the provider
 * isn't explicitly disabled AND a complete, usable transport
 * configuration exists (no partial/broken config is ever treated as
 * "enabled").
 */

export type EmailTransportName = 'smtp' | 'resend'

export type SmtpConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

export type ResendConfig = {
  apiKey: string
  from: string
}

export type EmailProviderConfig = {
  enabled: boolean
  transport: EmailTransportName | null
  recipient: string | null
  smtp: SmtpConfig | null
  resend: ResendConfig | null
}

function readSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM
  if (!host || !user || !pass || !from) return null
  return {
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    user,
    pass,
    from,
  }
}

function readResendConfig(): ResendConfig | null {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM
  if (!apiKey || !from) return null
  return { apiKey, from }
}

export function getEmailProviderConfig(): EmailProviderConfig {
  const explicitlyDisabled = process.env.EMAIL_NOTIFICATIONS_ENABLED === 'false'
  const recipient = process.env.NOTIFICATION_EMAIL_TO || null
  const smtp = readSmtpConfig()
  const resend = readResendConfig()
  const requested = process.env.EMAIL_TRANSPORT as EmailTransportName | undefined

  // An explicitly requested transport must actually be configured — never
  // silently fall back to a different one the caller didn't ask for.
  // With no explicit request, Resend is preferred when both are present
  // (no local SMTP infrastructure to manage), otherwise whichever exists.
  const transport: EmailTransportName | null =
    requested === 'smtp' ? (smtp ? 'smtp' : null) :
    requested === 'resend' ? (resend ? 'resend' : null) :
    resend ? 'resend' :
    smtp ? 'smtp' :
    null

  const enabled = !explicitlyDisabled && transport !== null && recipient !== null

  return { enabled, transport, recipient, smtp, resend }
}

export type WhatsAppTransportName = 'meta' | 'twilio'

export type MetaWhatsAppConfig = {
  accessToken: string
  phoneNumberId: string
}

export type TwilioWhatsAppConfig = {
  accountSid: string
  authToken: string
  fromNumber: string
}

export type WhatsAppProviderConfig = {
  enabled: boolean
  transport: WhatsAppTransportName | null
  recipient: string | null
  meta: MetaWhatsAppConfig | null
  twilio: TwilioWhatsAppConfig | null
}

function readMetaConfig(): MetaWhatsAppConfig | null {
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID
  if (!accessToken || !phoneNumberId) return null
  return { accessToken, phoneNumberId }
}

function readTwilioConfig(): TwilioWhatsAppConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM
  if (!accountSid || !authToken || !fromNumber) return null
  return { accountSid, authToken, fromNumber }
}

export function getWhatsAppProviderConfig(): WhatsAppProviderConfig {
  const explicitlyDisabled = process.env.WHATSAPP_NOTIFICATIONS_ENABLED === 'false'
  const recipient = process.env.NOTIFICATION_WHATSAPP_TO || null
  const meta = readMetaConfig()
  const twilio = readTwilioConfig()
  const requested = process.env.WHATSAPP_TRANSPORT as WhatsAppTransportName | undefined

  const transport: WhatsAppTransportName | null =
    requested === 'meta' ? (meta ? 'meta' : null) :
    requested === 'twilio' ? (twilio ? 'twilio' : null) :
    meta ? 'meta' :
    twilio ? 'twilio' :
    null

  const enabled = !explicitlyDisabled && transport !== null && recipient !== null

  return { enabled, transport, recipient, meta, twilio }
}

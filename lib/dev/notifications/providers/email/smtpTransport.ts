import nodemailer from 'nodemailer'
import { DeliveryError } from '../../retryPolicy'
import type { SmtpConfig } from '../../providerConfig'
import type { EmailContent } from './emailContent'

/**
 * SMTP reply codes are the inverse of HTTP's convention: 4xx means
 * temporary/transient (retry later), 5xx means permanent (the server
 * rejected the message outright — retrying won't help). nodemailer
 * surfaces this as `err.responseCode` when the SMTP server itself
 * returned a code; a connection-level failure (DNS, timeout, ECONNREFUSED)
 * has no responseCode at all and is always transient.
 */
function classifySmtpError(err: unknown): DeliveryError {
  const responseCode = (err as { responseCode?: number } | null)?.responseCode
  const message = err instanceof Error ? err.message : String(err)
  if (typeof responseCode === 'number' && responseCode >= 500) return new DeliveryError(`SMTP permanent failure (${responseCode}): ${message}`, 'Permanent')
  return new DeliveryError(`SMTP transient failure${responseCode ? ` (${responseCode})` : ''}: ${message}`, 'Transient')
}

export async function sendViaSmtp(config: SmtpConfig, recipient: string, content: EmailContent): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  })

  try {
    await transporter.sendMail({
      from: config.from,
      to: recipient,
      subject: content.subject,
      text: content.text,
      html: content.html,
    })
  } catch (err) {
    throw classifySmtpError(err)
  }
}

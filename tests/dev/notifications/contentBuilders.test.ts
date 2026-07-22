import { describe, it, expect } from 'vitest'
import { buildEmailContent } from '../../../lib/dev/notifications/providers/email/emailContent'
import { buildWhatsAppMessage } from '../../../lib/dev/notifications/providers/whatsapp/whatsappContent'
import type { NotificationEvent } from '../../../lib/dev/notifications/notificationTypes'

function event(overrides: Partial<NotificationEvent> = {}): NotificationEvent {
  return {
    id: 'e1', type: 'CEO Approval Required', project: 'acme', title: 'Batch B3 needs approval',
    message: 'The build is failing and requires review.', severity: 'High',
    timestamp: '2026-01-01T00:00:00.000Z', metadata: {}, ...overrides,
  }
}

describe('Email content builder', () => {
  it('includes the project, severity, and message', () => {
    const content = buildEmailContent(event())
    expect(content.subject).toContain('Batch B3 needs approval')
    expect(content.text).toContain('acme')
    expect(content.text).toContain('High')
    expect(content.text).toContain('The build is failing and requires review.')
    expect(content.html).toContain('acme')
  })

  it('marks an approval request as Action Required in the subject', () => {
    const content = buildEmailContent(event({ type: 'CEO Approval Required' }))
    expect(content.subject).toMatch(/Action Required/)
  })

  it('marks an escalation distinctly from a summary', () => {
    const escalation = buildEmailContent(event({ type: 'Project Blocked' }))
    const summary = buildEmailContent(event({ type: 'Milestone Completed', severity: 'Info' }))
    expect(escalation.subject).toMatch(/Escalation/)
    expect(summary.subject).toMatch(/Engineering Update/)
    expect(escalation.subject).not.toBe(summary.subject)
  })

  it('escapes HTML-significant characters in the message so it cannot break the email markup', () => {
    const content = buildEmailContent(event({ message: '<script>alert(1)</script> & "quotes"' }))
    expect(content.html).not.toContain('<script>')
    expect(content.html).toContain('&lt;script&gt;')
  })

  it('produces a distinct plain-text version alongside the HTML', () => {
    const content = buildEmailContent(event())
    expect(content.text).not.toContain('<div>')
  })
})

describe('WhatsApp content builder', () => {
  it('is plain text — no HTML markup at all', () => {
    const message = buildWhatsAppMessage(event())
    expect(message).not.toMatch(/<[a-z]+>/i)
  })

  it('includes the project, severity, title, and message', () => {
    const message = buildWhatsAppMessage(event())
    expect(message).toContain('acme')
    expect(message).toContain('High')
    expect(message).toContain('Batch B3 needs approval')
    expect(message).toContain('The build is failing and requires review.')
  })

  it('adds a call-to-action line only for approval requests', () => {
    const approval = buildWhatsAppMessage(event({ type: 'CEO Approval Required' }))
    const notification = buildWhatsAppMessage(event({ type: 'Engineering Resumed', severity: 'Info' }))
    expect(approval).toMatch(/Command Centre/)
    expect(notification).not.toMatch(/Command Centre/)
  })

  it('is a pure function — identical event produces identical output', () => {
    const e = event()
    expect(buildWhatsAppMessage(e)).toBe(buildWhatsAppMessage(e))
  })
})

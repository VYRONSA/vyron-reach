import { describe, it, expect } from 'vitest'
import { classifyEvent } from '../../../lib/dev/notifications/eventClassification'
import type { NotificationEvent } from '../../../lib/dev/notifications/notificationTypes'

function event(overrides: Partial<NotificationEvent> = {}): NotificationEvent {
  return {
    id: 'e1', type: 'Engineering Paused', project: 'acme', title: 'x', message: 'x',
    severity: 'Info', timestamp: '2026-01-01T00:00:00.000Z', metadata: {}, ...overrides,
  }
}

describe('Event Classification', () => {
  it('classifies CEO/Business Rule/Security approval types as ApprovalRequest', () => {
    expect(classifyEvent(event({ type: 'CEO Approval Required' }))).toBe('ApprovalRequest')
    expect(classifyEvent(event({ type: 'Business Rule Required' }))).toBe('ApprovalRequest')
    expect(classifyEvent(event({ type: 'Security Approval Required' }))).toBe('ApprovalRequest')
  })

  it('classifies Project Blocked as Escalation', () => {
    expect(classifyEvent(event({ type: 'Project Blocked' }))).toBe('Escalation')
  })

  it('classifies any Critical-severity event as Escalation, regardless of type', () => {
    expect(classifyEvent(event({ type: 'Engineering Paused', severity: 'Critical' }))).toBe('Escalation')
  })

  it('classifies completion types as EngineeringSummary', () => {
    expect(classifyEvent(event({ type: 'Development Completed' }))).toBe('EngineeringSummary')
    expect(classifyEvent(event({ type: 'Milestone Completed' }))).toBe('EngineeringSummary')
    expect(classifyEvent(event({ type: 'Phase Completed' }))).toBe('EngineeringSummary')
    expect(classifyEvent(event({ type: 'Project Completed' }))).toBe('EngineeringSummary')
  })

  it('classifies everything else as a general Notification', () => {
    expect(classifyEvent(event({ type: 'Engineering Resumed' }))).toBe('Notification')
    expect(classifyEvent(event({ type: 'Engineering Paused', severity: 'Low' }))).toBe('Notification')
  })

  it('Escalation takes priority over a completion type if severity is Critical', () => {
    expect(classifyEvent(event({ type: 'Milestone Completed', severity: 'Critical' }))).toBe('Escalation')
  })
})

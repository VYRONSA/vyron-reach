import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { attemptEmailDelivery } from '../../../lib/dev/notifications/providers/emailNotificationProvider'
import type { NotificationEvent } from '../../../lib/dev/notifications/notificationTypes'

/**
 * PRA-P1-034 remediation — proves the actual mitigation: a Resend send
 * carries the NotificationEvent's own (stable, never regenerated) id as
 * an Idempotency-Key, so a resumed retry after a crash (deliveryBootstrap.ts)
 * is recognized by Resend as the same send rather than emailing twice.
 */

const ENV_KEYS = ['EMAIL_NOTIFICATIONS_ENABLED', 'EMAIL_TRANSPORT', 'NOTIFICATION_EMAIL_TO', 'RESEND_API_KEY', 'RESEND_FROM']

let savedEnv: Record<string, string | undefined> = {}
let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
  savedEnv = {}
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key]
    delete process.env[key]
  }
  process.env.NOTIFICATION_EMAIL_TO = 'ceo@example.com'
  process.env.RESEND_API_KEY = 'key'
  process.env.RESEND_FROM = 'noreply@example.com'
})

afterEach(() => {
  vi.unstubAllGlobals()
  isolated.cleanup()
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key]
    else process.env[key] = savedEnv[key]
  }
})

function event(overrides: Partial<NotificationEvent> = {}): NotificationEvent {
  return {
    id: `evt_${uniqueSlug()}`, type: 'CEO Approval Required', project: uniqueSlug(), title: 'x', message: 'x',
    severity: 'High', timestamp: '2026-01-01T00:00:00.000Z', metadata: {}, ...overrides,
  }
}

describe('Resend delivery — idempotency key (PRA-P1-034)', () => {
  it('sends the NotificationEvent id as the Idempotency-Key header', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const e = event()
    await attemptEmailDelivery(e)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, init] = fetchMock.mock.calls[0]
    const headers = init.headers as Record<string, string>
    expect(headers['Idempotency-Key']).toBe(e.id)
  })

  it('a simulated retry of the same event sends the identical idempotency key both times', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const e = event()
    await attemptEmailDelivery(e)
    await attemptEmailDelivery(e)

    const keys = fetchMock.mock.calls.map(([, init]) => (init.headers as Record<string, string>)['Idempotency-Key'])
    expect(keys).toEqual([e.id, e.id])
  })
})

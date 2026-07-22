import { describe, it, expect } from 'vitest'

describe('Director status route — PRA-P1-017', () => {
  it('no longer exposes a POST handler that could bypass lifecycle guards', async () => {
    const route = await import('../../../app/api/dev/director/status/route')
    expect(route.GET).toBeTypeOf('function')
    expect((route as { POST?: unknown }).POST).toBeUndefined()
  })

  it('the client no longer exposes a wrapper for the removed patch endpoint', async () => {
    const client = await import('../../../lib/dev/runtime/directorClient')
    expect((client as { patchDirectorStatus?: unknown }).patchDirectorStatus).toBeUndefined()
  })
})

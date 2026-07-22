import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { subscribe, getEventsSince, getCurrentSeq, isWithinRetention } from '@/lib/dev/events/eventBus'
import { buildDashboardSnapshot } from '@/lib/dev/events/dashboardSnapshot'
import type { DashboardEvent } from '@/lib/dev/events/eventTypes'

/**
 * The Real-Time Event Service's SSE transport — the primary way the
 * dashboard consumes events (see app/api/dev/events/poll/route.ts for the
 * polling fallback, which shares the exact same event model: both routes
 * read from the same eventBus.ts and dashboardSnapshot.ts, so a client
 * can move between transports without any change to how it interprets
 * what it receives).
 *
 * "Late subscribers must synchronize with current state" — a fresh
 * connection (no `Last-Event-ID`) gets one `snapshot` frame before any
 * `update` frames. A reconnecting client (browsers send `Last-Event-ID`
 * automatically) gets exactly the events it missed, replayed in order
 * from the ring buffer — or, if the gap is wider than the buffer's
 * retention window, a fresh snapshot instead of silently skipping events
 * it can no longer prove it received.
 *
 * "Guarantee ordered delivery per connection" / "avoid duplicate event
 * processing": every frame carries `id: <seq>`, the monotonically
 * increasing sequence number from eventBus.ts. The client's own dedup
 * only needs to track the highest seq it has applied.
 */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json' } })
  }

  const project = request.nextUrl.searchParams.get('project') ?? undefined
  const lastEventId = request.headers.get('last-event-id')
  const encoder = new TextEncoder()

  let unsubscribe: () => void = () => {}
  let heartbeat: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    start(controller) {
      const send = (eventName: string, data: unknown, id?: number) => {
        let frame = ''
        if (id !== undefined) frame += `id: ${id}\n`
        frame += `event: ${eventName}\n`
        frame += `data: ${JSON.stringify(data)}\n\n`
        try {
          controller.enqueue(encoder.encode(frame))
        } catch {
          // Connection already closed on the client side — the abort
          // listener below will run momentarily and clean up; nothing
          // further to do here.
        }
      }

      const sinceSeq = lastEventId ? Number(lastEventId) : null
      if (sinceSeq !== null && Number.isFinite(sinceSeq) && isWithinRetention(sinceSeq)) {
        for (const event of getEventsSince(sinceSeq, project)) send('update', event, event.seq)
      } else {
        send('snapshot', buildDashboardSnapshot(project), getCurrentSeq())
      }

      unsubscribe = subscribe((event: DashboardEvent) => {
        if (project && event.project !== project && event.project !== '*') return
        send('update', event, event.seq)
      })

      // Keeps intermediate proxies/load balancers from timing out an
      // apparently-idle connection — a comment line, not a named event,
      // so it never reaches EventSource's onmessage/addEventListener at all.
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          // closed — cleanup below handles it
        }
      }, 20_000)

      request.signal.addEventListener('abort', () => {
        if (heartbeat) clearInterval(heartbeat)
        unsubscribe()
        try {
          controller.close()
        } catch {
          // already closed
        }
      })
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat)
      unsubscribe()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

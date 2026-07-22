'use client'

import { useEffect, useRef, useState } from 'react'
import type { DashboardEvent, DashboardEventCategory } from '@/lib/dev/events/eventTypes'
import type { DashboardSnapshot } from '@/lib/dev/events/dashboardSnapshot'

/**
 * The dashboard's only subscription to the Real-Time Event Service —
 * "The UI subscribes only to the Event Service. Do not allow components
 * to subscribe directly to Directors, Scheduler, Inbox, Notifications, or
 * other services." Every dashboard panel that wants live updates uses
 * this hook (or app/api/dev/events/{stream,poll} directly, which is all
 * this hook itself does) rather than inventing its own polling or
 * subscription mechanism.
 *
 * Prefers Server-Sent Events; falls back to polling app/api/dev/events/
 * poll/route.ts — the same route, request shape, and response shape used
 * whether SSE was never available (no `EventSource` global) or became
 * unavailable mid-session (sustained connection errors). Both transports
 * share one dedup/ordering rule: an event is only ever applied if its
 * `seq` is strictly greater than the highest `seq` already applied.
 */

const RECONNECT_ERROR_THRESHOLD_MS = 15_000
const POLL_INTERVAL_MS = 5_000

export type ConnectionState = 'connecting' | 'open' | 'reconnecting' | 'polling' | 'closed'

export type UseDashboardEventsOptions = {
  /** Omit to receive every project's events (categories still apply) — used by whole-portfolio views like the Scheduler panel. */
  project?: string
  /** Client-side filter — the server already scopes by project, but category filtering stays client-side so the bus itself never needs to know about per-panel interests. Omit to receive every category. */
  categories?: DashboardEventCategory[]
  onEvent?: (event: DashboardEvent) => void
  onSnapshot?: (snapshot: DashboardSnapshot) => void
}

export function useDashboardEvents(options: UseDashboardEventsOptions): { connectionState: ConnectionState } {
  const { project, categories, onEvent, onSnapshot } = options
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting')

  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent
  const onSnapshotRef = useRef(onSnapshot)
  onSnapshotRef.current = onSnapshot
  const categoriesRef = useRef(categories)
  categoriesRef.current = categories

  useEffect(() => {
    let cancelled = false
    let lastSeq = -1
    let source: EventSource | null = null
    let pollTimer: ReturnType<typeof setInterval> | null = null
    let errorSince: number | null = null
    let errorCheckTimer: ReturnType<typeof setInterval> | null = null

    const matchesFilter = (category: DashboardEventCategory) => {
      const list = categoriesRef.current
      return !list || list.includes(category)
    }

    const applyEvent = (event: DashboardEvent) => {
      if (event.seq <= lastSeq) return // already applied — SSE replay or a racing poll tick, dedup by seq
      lastSeq = event.seq
      if (matchesFilter(event.category)) onEventRef.current?.(event)
    }

    const applySnapshot = (snapshot: DashboardSnapshot) => {
      lastSeq = snapshot.seq
      onSnapshotRef.current?.(snapshot)
    }

    const buildUrl = (base: string, extra: Record<string, string>) => {
      const url = new URL(base, window.location.origin)
      if (project) url.searchParams.set('project', project)
      for (const [key, value] of Object.entries(extra)) url.searchParams.set(key, value)
      return url.toString()
    }

    const stopPolling = () => {
      if (pollTimer) clearInterval(pollTimer)
      pollTimer = null
    }

    const pollOnce = async () => {
      try {
        const url = buildUrl('/api/dev/events/poll', lastSeq >= 0 ? { since: String(lastSeq) } : {})
        const res = await fetch(url)
        if (!res.ok) return
        const body = (await res.json()) as { events: DashboardEvent[]; seq: number; snapshot: DashboardSnapshot | null }
        if (cancelled) return
        if (body.snapshot) {
          applySnapshot(body.snapshot)
        } else {
          for (const event of body.events) applyEvent(event)
          lastSeq = Math.max(lastSeq, body.seq)
        }
      } catch {
        // A single failed poll tick is not fatal — the next interval tries again.
      }
    }

    const startPolling = () => {
      stopSse()
      if (pollTimer) return
      setConnectionState('polling')
      pollOnce()
      pollTimer = setInterval(pollOnce, POLL_INTERVAL_MS)
    }

    function stopSse() {
      if (errorCheckTimer) clearInterval(errorCheckTimer)
      errorCheckTimer = null
      if (source) {
        source.close()
        source = null
      }
    }

    const startSse = () => {
      const url = buildUrl('/api/dev/events/stream', {})
      const es = new EventSource(url)
      source = es

      es.addEventListener('snapshot', ev => {
        if (cancelled) return
        errorSince = null
        setConnectionState('open')
        try {
          applySnapshot(JSON.parse((ev as MessageEvent).data))
        } catch {
          // malformed frame — ignore, the next event/heartbeat keeps the connection alive
        }
      })

      es.addEventListener('update', ev => {
        if (cancelled) return
        errorSince = null
        try {
          applyEvent(JSON.parse((ev as MessageEvent).data))
        } catch {
          // malformed frame — ignore
        }
      })

      es.onopen = () => {
        if (cancelled) return
        errorSince = null
        setConnectionState('open')
      }

      es.onerror = () => {
        if (cancelled) return
        if (errorSince === null) errorSince = Date.now()
        setConnectionState('reconnecting')
        // The browser's native EventSource already retries the
        // connection on its own; we only step in if it stays broken long
        // enough to call this "broken" rather than "a brief blip" —
        // "Detect broken connections. Automatically reconnect." covers
        // both the native retry (the common case) and this fallback (a
        // genuinely unavailable SSE transport, e.g. a proxy that strips
        // streaming responses).
      }

      errorCheckTimer = setInterval(() => {
        if (errorSince !== null && Date.now() - errorSince > RECONNECT_ERROR_THRESHOLD_MS) {
          startPolling()
        }
      }, 2_000)
    }

    if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
      startSse()
    } else {
      startPolling()
    }

    return () => {
      cancelled = true
      stopSse()
      stopPolling()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project])

  return { connectionState }
}

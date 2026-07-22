'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DevButton, DevCard, DevEmptyState, DevRow } from '../ui'
import { InitiationStatusBadge } from './InitiationStatusBadge'
import { useDashboardEvents } from '../realtime/useDashboardEvents'
import type { InitiationRequest } from '@/lib/dev/initiation/initiationTypes'

async function fetchInitiations(): Promise<InitiationRequest[]> {
  const res = await fetch('/api/dev/initiation')
  if (!res.ok) throw new Error(`Failed to load initiations (${res.status})`)
  const body = await res.json()
  return body.initiations as InitiationRequest[]
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString()
}

export function InitiationListView() {
  const [initiations, setInitiations] = useState<InitiationRequest[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = () => fetchInitiations().then(setInitiations).catch(err => setError(err instanceof Error ? err.message : 'Failed to load.'))

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useDashboardEvents({ categories: ['Project Initiation'], onEvent: refresh })

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link href="/dev/initiation/new">
          <DevButton>New Executive Directive</DevButton>
        </Link>
      </div>

      {error ? <p className="mb-3 text-sm text-rose-500 dark:text-rose-400">{error}</p> : null}

      <DevCard>
        {initiations === null ? (
          <p className="text-sm text-[var(--dev-text-faint)]">Loading…</p>
        ) : initiations.length === 0 ? (
          <DevEmptyState>No Executive Directives submitted yet.</DevEmptyState>
        ) : (
          <div>
            {initiations.map(initiation => (
              <Link key={initiation.id} href={`/dev/initiation/${initiation.id}`} className="block">
                <DevRow
                  label={`${initiation.directiveTitle} — ${initiation.project}`}
                  value={
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-[var(--dev-text-faint)]">{formatTimestamp(initiation.updatedAt)}</span>
                      <InitiationStatusBadge status={initiation.status} />
                    </span>
                  }
                />
              </Link>
            ))}
          </div>
        )}
      </DevCard>
    </div>
  )
}

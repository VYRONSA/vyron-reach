'use client'

import type { BuildIntelligence } from '@/lib/dev/buildIntelligence'
import { DevBadge, DevCard, DevCardHeader, DevField, devReadinessTone, devValidationTone } from './ui'

const EMPTY_BUILD: BuildIntelligence = {
  buildAvailable: false,
  lastBuildStatus: 'Unknown',
  lastTypeScriptStatus: 'Unknown',
  buildTimestamp: 'Unavailable',
  buildEnvironment: 'Unknown',
  buildReadiness: 'Needs Review',
  buildConfidence: 'Unknown',
}

function fmt(iso: string) {
  if (iso === 'Unavailable') return iso
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString()
}

/**
 * Build Intelligence — read-only validation state, driven entirely by
 * lib/dev/buildIntelligence.ts. Like Git/Deployment Intelligence, this
 * card doesn't self-fetch: the caller resolves the engine once and
 * passes the plain result down as a prop.
 */
export function BuildIntelligenceCard({ build }: { build?: BuildIntelligence }) {
  const info = build ?? EMPTY_BUILD

  return (
    <DevCard>
      <DevCardHeader
        title="Build Intelligence"
        badge={<DevBadge tone={devReadinessTone(info.buildReadiness)}>{info.buildReadiness}</DevBadge>}
      />

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <DevField label="Build Status">
          <DevBadge tone={devValidationTone(info.lastBuildStatus)}>{info.lastBuildStatus}</DevBadge>
        </DevField>
        <DevField label="TypeScript Status">
          <DevBadge tone={devValidationTone(info.lastTypeScriptStatus)}>{info.lastTypeScriptStatus}</DevBadge>
        </DevField>
        <DevField label="Build Confidence">
          <span className="text-sm text-[var(--dev-text)]">{info.buildConfidence}</span>
        </DevField>
        <DevField label="Validation State">
          <span className="text-sm text-[var(--dev-text)]">{info.buildReadiness}</span>
        </DevField>
        <DevField label="Last Validation">
          <span className="text-sm text-[var(--dev-text)]">{fmt(info.buildTimestamp)}</span>
        </DevField>
      </div>
    </DevCard>
  )
}

'use client'

import type { DeploymentIntelligence } from '@/lib/dev/deploymentIntelligence'
import { DevBadge, DevCard, DevCardHeader, DevField, devReadinessTone } from './ui'

const EMPTY_DEPLOYMENT: DeploymentIntelligence = {
  deploymentAvailable: false,
  environment: 'Not Configured',
  productionUrl: 'Not Configured',
  previewUrl: 'Not Configured',
  localUrl: 'Unavailable',
  lastDeploymentStatus: 'Unknown',
  lastDeploymentTime: 'Unavailable',
  deploymentReadiness: 'Needs Review',
}

/**
 * Deployment Intelligence — read-only deployment state, driven entirely
 * by lib/dev/deploymentIntelligence.ts. Like Git Intelligence, that
 * engine only resolves server-side (it reads env vars/config files not
 * exposed to the client), so this card doesn't self-fetch: the caller
 * resolves it once in a Server Component and passes the plain result
 * down as a prop.
 */
export function DeploymentIntelligenceCard({ deployment }: { deployment?: DeploymentIntelligence }) {
  const info = deployment ?? EMPTY_DEPLOYMENT

  return (
    <DevCard>
      <DevCardHeader
        title="Deployment Intelligence"
        badge={<DevBadge tone={devReadinessTone(info.deploymentReadiness)}>{info.deploymentReadiness}</DevBadge>}
      />

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <DevField label="Deployment Status">
          <span className="text-sm text-[var(--dev-text)]">{info.deploymentAvailable ? 'Available' : 'Not Configured'}</span>
        </DevField>
        <DevField label="Environment">
          <span className="text-sm text-[var(--dev-text)]">{info.environment}</span>
        </DevField>
        <DevField label="Deployment Readiness">
          <span className="text-sm text-[var(--dev-text)]">{info.deploymentReadiness}</span>
        </DevField>
        <DevField label="Production URL">
          <span className="truncate text-sm text-[var(--dev-text)]">{info.productionUrl}</span>
        </DevField>
        <DevField label="Last Deployment">
          <span className="text-sm text-[var(--dev-text)]">
            {info.lastDeploymentTime !== 'Unavailable' ? info.lastDeploymentTime : info.lastDeploymentStatus}
          </span>
        </DevField>
      </div>
    </DevCard>
  )
}

import { DevBadge } from '../ui'
import type { InitiationStatus } from '@/lib/dev/initiation/initiationTypes'

const TONE: Record<InitiationStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  Draft: 'neutral',
  Generating: 'info',
  GenerationFailed: 'danger',
  Review: 'warning',
  Approved: 'info',
  Provisioning: 'info',
  Provisioned: 'success',
  ProvisioningFailed: 'danger',
  Cancelled: 'neutral',
}

export function InitiationStatusBadge({ status }: { status: InitiationStatus }) {
  return <DevBadge tone={TONE[status]}>{status}</DevBadge>
}

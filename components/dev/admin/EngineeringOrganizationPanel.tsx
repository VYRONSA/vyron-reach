'use client'

import { useEffect, useState } from 'react'
import type { Project } from '@/lib/dev/projectsData'
import { getEngineeringOrganizationState, initializeEngineeringOrganization } from '@/lib/dev/initializer/organizationInitializer'
import type { EngineeringOrganizationState } from '@/lib/dev/initializer/initializerTypes'
import { DevBadge, DevButton, DevSectionLabel } from '../ui'

/**
 * The Engineering Organization Initializer's UI — "a newly created
 * product should become engineering-ready with a single action." Reads
 * state synchronously from localStorage (organizationInitializer.ts),
 * then on click runs the full Initializer (Roadmap → Batches → Queue
 * locally, Learning + DNA via one server round trip) and reports what
 * each step actually did. `onChange` lets the parent refresh its own
 * milestones list, the same pattern AdminMilestoneSection/
 * AdminBatchSection already use.
 */
export function EngineeringOrganizationPanel({ project, onChange }: { project: Project; onChange: () => void }) {
  const [state, setState] = useState<EngineeringOrganizationState | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setState(getEngineeringOrganizationState(project.slug))
  }, [project.slug])

  const handleInitialize = async () => {
    setRunning(true)
    setError(null)
    try {
      const { state: next } = await initializeEngineeringOrganization(project, 'Owner')
      setState(next)
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize the engineering organization.')
    } finally {
      setRunning(false)
    }
  }

  if (!state) return null

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <DevSectionLabel>Engineering Organization</DevSectionLabel>
        <DevBadge tone={state.engineeringReady ? 'success' : 'neutral'}>{state.engineeringReady ? 'Ready' : 'Not Initialized'}</DevBadge>
      </div>

      <p className="mt-2 text-xs text-[var(--dev-text-faint)]">
        {state.engineeringReady
          ? `Initialized ${state.initializedAt ? new Date(state.initializedAt).toLocaleString() : 'previously'} by ${state.initializedBy ?? 'Owner'}.`
          : 'Creates the roadmap, milestones, batches, queue, learning system, and first Engineering DNA profile for this product in one action.'}
      </p>

      <div className="mt-3">
        <DevButton onClick={handleInitialize} disabled={running}>
          {running ? 'Initializing…' : state.engineeringReady ? 'Re-run Initializer' : 'Initialize Engineering Organization'}
        </DevButton>
      </div>

      {error ? <p className="mt-2 text-xs text-rose-500 dark:text-rose-400">{error}</p> : null}

      {state.lastAudit ? (
        <div className="mt-4 space-y-1.5 rounded-xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-3">
          <div className="text-xs font-medium text-[var(--dev-text)]">Last run — {state.lastAudit.durationMs}ms</div>
          {state.lastAudit.steps.map(step => (
            <div key={step.step} className="text-[11px] text-[var(--dev-text-faint)]">
              {step.step}: {step.created.length} created, {step.skipped.length} skipped
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

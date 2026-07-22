'use client'

import { useEffect, useState } from 'react'
import type { ScenarioId, SimulationReport, LoadProfileLabel } from '@/lib/dev/simulation/simulationTypes'
import { DevBadge, DevButton, DevCard, DevCardHeader, DevEmptyState, DevField } from './ui'

type ScenarioInfo = { id: ScenarioId; workerFailureRate: number; ceoInterventionRate: number; concurrentProjects: boolean; escalationChain: boolean }

const LOAD_PROFILES: LoadProfileLabel[] = ['Small', 'Medium', 'Large', 'Enterprise']

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  Running: 'warning',
  Completed: 'success',
  Failed: 'danger',
}

function fmtPct(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}%`
}

async function fetchScenarios(): Promise<ScenarioInfo[]> {
  const res = await fetch('/api/dev/simulation/scenarios')
  if (!res.ok) throw new Error(`Failed to load scenarios (${res.status})`)
  const body = await res.json()
  return body.scenarios
}

async function fetchReports(): Promise<SimulationReport[]> {
  const res = await fetch('/api/dev/simulation/reports?pageSize=20')
  if (!res.ok) throw new Error(`Failed to load simulation reports (${res.status})`)
  const body = await res.json()
  return body.items
}

async function triggerRun(scenario: ScenarioId, loadProfile: LoadProfileLabel, seed: number): Promise<SimulationReport> {
  const res = await fetch('/api/dev/simulation/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario, loadProfile, seed }),
  })
  if (!res.ok) throw new Error(`Failed to run simulation (${res.status})`)
  const body = await res.json()
  return body.report
}

/**
 * The Simulation Dashboard (Production Validation 2.1, Milestone 2.1.3)
 * — read-only reporting plus one real action: running a new simulation.
 * Every number displayed comes straight from a SimulationReport already
 * computed by simulationRunner.ts; this component performs no
 * simulation logic itself.
 */
export function SimulationDashboard() {
  const [scenarios, setScenarios] = useState<ScenarioInfo[]>([])
  const [reports, setReports] = useState<SimulationReport[]>([])
  const [selected, setSelected] = useState<SimulationReport | null>(null)
  const [scenario, setScenario] = useState<ScenarioId>('single-feature')
  const [loadProfile, setLoadProfile] = useState<LoadProfileLabel>('Small')
  const [seed, setSeed] = useState(1)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshReports = () => {
    fetchReports()
      .then(setReports)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load reports.'))
  }

  useEffect(() => {
    fetchScenarios()
      .then(list => {
        setScenarios(list)
        if (list.length > 0) setScenario(list[0].id)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load scenarios.'))
    refreshReports()
    const timer = setInterval(refreshReports, 10_000)
    return () => clearInterval(timer)
  }, [])

  const handleRun = async () => {
    setRunning(true)
    setError(null)
    try {
      const report = await triggerRun(scenario, loadProfile, seed)
      setSelected(report)
      refreshReports()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run simulation.')
    } finally {
      setRunning(false)
    }
  }

  const runningReports = reports.filter(r => r.status === 'Running')
  const historicalReports = reports.filter(r => r.status !== 'Running')

  return (
    <div className="space-y-4">
      <DevCard>
        <DevCardHeader title="Run a Simulation" />
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-[var(--dev-text-muted)]">
            Scenario
            <select
              value={scenario}
              onChange={e => setScenario(e.target.value as ScenarioId)}
              className="rounded-lg border border-[var(--dev-border-strong)] bg-[var(--dev-input-bg)] px-2 py-1.5 text-sm text-[var(--dev-text)]"
            >
              {scenarios.map(s => (
                <option key={s.id} value={s.id}>
                  {s.id}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--dev-text-muted)]">
            Load Profile
            <select
              value={loadProfile}
              onChange={e => setLoadProfile(e.target.value as LoadProfileLabel)}
              className="rounded-lg border border-[var(--dev-border-strong)] bg-[var(--dev-input-bg)] px-2 py-1.5 text-sm text-[var(--dev-text)]"
            >
              {LOAD_PROFILES.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--dev-text-muted)]">
            Seed (deterministic replay)
            <input
              type="number"
              value={seed}
              onChange={e => setSeed(Number(e.target.value))}
              className="w-24 rounded-lg border border-[var(--dev-border-strong)] bg-[var(--dev-input-bg)] px-2 py-1.5 text-sm text-[var(--dev-text)]"
            />
          </label>
          <DevButton onClick={handleRun} disabled={running}>
            {running ? 'Running...' : 'Run Simulation'}
          </DevButton>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-500 dark:text-rose-400">{error}</p> : null}
      </DevCard>

      {runningReports.length > 0 ? (
        <DevCard>
          <DevCardHeader title="Running Simulations" />
          <ul className="mt-3 space-y-1">
            {runningReports.map(r => (
              <li key={r.id} className="text-sm text-[var(--dev-text)]">
                {r.scenario} ({r.configuration.loadProfile}) — started {new Date(r.startedAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </DevCard>
      ) : null}

      <DevCard>
        <DevCardHeader title="Historical Simulations" />
        {historicalReports.length === 0 ? (
          <DevEmptyState>No simulations run yet.</DevEmptyState>
        ) : (
          <ul className="mt-3 space-y-2">
            {historicalReports.map(r => (
              <li key={r.id} className="rounded-lg border border-[var(--dev-border)] p-3">
                <button type="button" onClick={() => setSelected(r)} className="w-full text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <DevBadge tone={STATUS_TONE[r.status] ?? 'neutral'}>{r.status}</DevBadge>
                    <span className="text-sm font-medium text-[var(--dev-text)]">{r.scenario}</span>
                    <span className="text-xs text-[var(--dev-text-faint)]">{r.configuration.loadProfile} · seed {r.configuration.seed}</span>
                    <span className="ml-auto text-xs text-[var(--dev-text-faint)]">{new Date(r.startedAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-[var(--dev-text-muted)]">{r.summary}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DevCard>

      {selected ? (
        <DevCard>
          <DevCardHeader title={`Report — ${selected.scenario}`} badge={<DevBadge tone={STATUS_TONE[selected.status] ?? 'neutral'}>{selected.status}</DevBadge>} />
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-5">
            <DevField label="Completion Rate"><span className="text-sm">{fmtPct(selected.measurements.completionRate)}</span></DevField>
            <DevField label="Recovery Rate"><span className="text-sm">{fmtPct(selected.measurements.recoveryRate)}</span></DevField>
            <DevField label="Failure Rate"><span className="text-sm">{fmtPct(selected.measurements.failureRate)}</span></DevField>
            <DevField label="Automation %"><span className="text-sm">{fmtPct(selected.measurements.automationPercentage)}</span></DevField>
            <DevField label="Worker Utilisation"><span className="text-sm">{fmtPct(selected.measurements.workerUtilisation !== null ? selected.measurements.workerUtilisation * 100 : null)}</span></DevField>
            <DevField label="Scheduler Utilisation"><span className="text-sm">{fmtPct(selected.measurements.schedulerUtilisation !== null ? selected.measurements.schedulerUtilisation * 100 : null)}</span></DevField>
            <DevField label="Queue Growth"><span className="text-sm">{selected.measurements.queueGrowth}</span></DevField>
            <DevField label="Avg Recovery Duration"><span className="text-sm">{selected.measurements.averageRecoveryDurationMs !== null ? `${Math.round(selected.measurements.averageRecoveryDurationMs)}ms` : '—'}</span></DevField>
          </div>

          {selected.certificationOutcome ? (
            <div className="mt-4">
              <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--dev-text-muted)]">Certification Outcome</h3>
              <div className="mt-1 flex gap-4 text-sm text-[var(--dev-text)]">
                <span>Autonomous: {selected.certificationOutcome.certifiedAutonomous}</span>
                <span>Assisted: {selected.certificationOutcome.certifiedAssisted}</span>
                <span>Manual: {selected.certificationOutcome.manualDelivery}</span>
              </div>
            </div>
          ) : null}

          {selected.failures.length > 0 ? (
            <div className="mt-4">
              <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--dev-text-muted)]">Failures &amp; Recoveries</h3>
              <ul className="mt-1 space-y-1 text-xs text-[var(--dev-text-muted)]">
                {selected.failures.map((f, i) => (
                  <li key={i}>
                    Step {f.step}: {f.detail}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--dev-text-muted)]">Timeline ({selected.timeline.length} steps)</h3>
            <ul className="mt-1 max-h-64 space-y-0.5 overflow-y-auto text-xs text-[var(--dev-text-faint)]">
              {selected.timeline.slice(0, 100).map((t, i) => (
                <li key={i}>
                  [{t.step}] {t.type}: {t.detail}
                </li>
              ))}
            </ul>
          </div>
        </DevCard>
      ) : null}
    </div>
  )
}

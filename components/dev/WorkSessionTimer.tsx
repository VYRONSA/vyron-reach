'use client'

import { useEffect, useState } from 'react'
import { getProjects } from '@/lib/dev/projectsData'
import {
  currentElapsedSeconds,
  formatClock,
  formatDuration,
  getActiveTimer,
  pauseTimer,
  resumeTimer,
  startTimer,
  stopTimer,
  todaysTotalSeconds,
  type ActiveTimer,
} from '@/lib/dev/sessionStorage'
import { DevBadge, DevButton, DevCard, DevSelect, DevTextarea } from './ui'

export function WorkSessionTimer({ projectFilter }: { projectFilter?: string }) {
  const [timer, setTimer] = useState<ActiveTimer | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [todayTotal, setTodayTotal] = useState(0)
  const [project, setProject] = useState(projectFilter ?? '')
  const [showStopNotes, setShowStopNotes] = useState(false)
  const [stopNotes, setStopNotes] = useState('')

  const refresh = () => {
    const t = getActiveTimer()
    setTimer(t)
    setElapsed(currentElapsedSeconds(t))
    setTodayTotal(todaysTotalSeconds(projectFilter))
  }

  useEffect(() => {
    refresh()
    const id = window.setInterval(refresh, 1000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectFilter])

  if (!timer) return <div className="text-sm text-[var(--dev-text-faint)]">Loading timer...</div>

  const handleStart = () => {
    startTimer(project)
    refresh()
  }
  const handlePause = () => {
    pauseTimer()
    refresh()
  }
  const handleResume = () => {
    resumeTimer()
    refresh()
  }
  const handleStopClick = () => {
    setStopNotes('')
    setShowStopNotes(true)
  }
  const confirmStop = () => {
    stopTimer(stopNotes)
    setShowStopNotes(false)
    setStopNotes('')
    refresh()
  }
  const cancelStop = () => setShowStopNotes(false)

  const projectName = getProjects().find(p => p.slug === timer.project)?.name

  return (
    <DevCard eyebrow="Focus" title="Work Session Timer">
      <div className="mt-3">
        {!timer.running ? (
          <div className="space-y-3">
            {!projectFilter ? (
              <DevSelect value={project} onChange={e => setProject(e.target.value)}>
                <option value="">No project</option>
                {getProjects().map(p => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </DevSelect>
            ) : null}
            <DevButton onClick={handleStart}>Start session</DevButton>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-mono text-3xl font-semibold tabular-nums text-[var(--dev-text)]">{formatClock(elapsed)}</div>
              {timer.paused ? <DevBadge tone="warning">Paused</DevBadge> : <DevBadge tone="success">Running</DevBadge>}
            </div>
            {projectName ? <div className="text-xs text-[var(--dev-text-faint)]">{projectName}</div> : null}

            {!showStopNotes ? (
              <div className="flex items-center gap-2">
                {timer.paused ? (
                  <DevButton onClick={handleResume}>Resume</DevButton>
                ) : (
                  <DevButton variant="secondary" onClick={handlePause}>
                    Pause
                  </DevButton>
                )}
                <DevButton variant="danger" onClick={handleStopClick}>
                  Stop
                </DevButton>
              </div>
            ) : (
              <div className="space-y-2 rounded-lg border border-[var(--dev-border)] bg-[var(--dev-surface-hover)] p-3">
                <DevTextarea
                  value={stopNotes}
                  onChange={e => setStopNotes(e.target.value)}
                  placeholder="What did you work on? (optional)"
                  rows={2}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <DevButton onClick={confirmStop}>Save session</DevButton>
                  <DevButton variant="secondary" onClick={cancelStop}>
                    Cancel
                  </DevButton>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 border-t border-[var(--dev-border)] pt-3 text-xs text-[var(--dev-text-faint)]">
          Today&apos;s total: <span className="font-mono text-[var(--dev-text)]">{formatDuration(todayTotal)}</span>
        </div>
      </div>
    </DevCard>
  )
}

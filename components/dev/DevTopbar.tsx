'use client'

import { useEffect, useState } from 'react'
import { useDevExperience } from './DevExperience'
import { useDevPreferences } from '@/context/dev/DevPreferencesContext'
import { currentElapsedSeconds, formatClock, getActiveTimer } from '@/lib/dev/sessionStorage'

function TimerGlance() {
  const [seconds, setSeconds] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const tick = () => {
      const timer = getActiveTimer()
      if (!timer.running) {
        setSeconds(null)
        return
      }
      setSeconds(currentElapsedSeconds(timer))
      setPaused(timer.paused)
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  if (seconds === null) return null

  return (
    <span
      className={`hidden items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs tabular-nums sm:flex ${
        paused
          ? 'border-amber-500/30 text-amber-500 dark:text-amber-400'
          : 'border-emerald-500/30 text-emerald-500 dark:text-emerald-400'
      }`}
      title={paused ? 'Work session paused' : 'Work session running'}
    >
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${paused ? '' : 'animate-pulse'}`} />
      {formatClock(seconds)}
    </span>
  )
}

export function DevTopbar() {
  const { openSearch, openShortcuts } = useDevExperience()
  const { hydrated, setPreferences } = useDevPreferences()
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[var(--dev-border)] bg-[var(--dev-bg)]/90 px-8 py-3 backdrop-blur">
      <button
        type="button"
        onClick={openSearch}
        className="flex w-full max-w-sm items-center gap-2.5 rounded-lg border border-[var(--dev-border-strong)] bg-[var(--dev-input-bg)] px-3 py-2 text-left text-sm text-[var(--dev-text-faint)] transition-colors hover:border-[var(--dev-accent)]/40"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4 shrink-0">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="flex-1 truncate">Search projects, pages, knowledge...</span>
        <kbd className="rounded border border-[var(--dev-border-strong)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--dev-text-faint)]">
          Ctrl K
        </kbd>
      </button>

      <div className="flex items-center gap-3">
        <TimerGlance />

        {now ? (
          <span className="hidden font-mono text-xs text-[var(--dev-text-faint)] sm:inline">
            {now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} &middot;{' '}
            {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </span>
        ) : null}

        <button
          type="button"
          onClick={() => setPreferences({ focusMode: true })}
          disabled={!hydrated}
          title="Enter Focus Mode"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--dev-border-strong)] text-[var(--dev-text-faint)] transition-colors hover:border-[var(--dev-accent)]/40 hover:text-[var(--dev-text)] disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
            <circle cx="12" cy="12" r="7" />
            <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
          </svg>
        </button>

        <button
          type="button"
          onClick={openShortcuts}
          title="Keyboard shortcuts"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--dev-border-strong)] text-[var(--dev-text-faint)] transition-colors hover:border-[var(--dev-accent)]/40 hover:text-[var(--dev-text)]"
        >
          ?
        </button>
      </div>
    </header>
  )
}

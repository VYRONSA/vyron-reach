import { readLocal, writeLocal } from './localStore'

export type WorkSession = {
  id: string
  project: string // project slug, or '' for none
  notes: string
  startTime: string // ISO
  endTime: string // ISO
  durationSeconds: number
  createdAt: string
}

export type ActiveTimer = {
  running: boolean
  paused: boolean
  project: string
  notes: string
  originalStart: string | null // ISO — when the session first started
  segmentStart: string | null // ISO — when the current running segment began; null while paused/stopped
  accumulatedSeconds: number // seconds banked from prior running segments
}

const SESSIONS_KEY = 'vyron-dev-work-sessions-v1'
const ACTIVE_KEY = 'vyron-dev-active-timer-v1'

const IDLE_TIMER: ActiveTimer = {
  running: false,
  paused: false,
  project: '',
  notes: '',
  originalStart: null,
  segmentStart: null,
  accumulatedSeconds: 0,
}

export function getSessions(): WorkSession[] {
  return readLocal<WorkSession[]>(SESSIONS_KEY, [])
}

function saveSessions(sessions: WorkSession[]) {
  writeLocal(SESSIONS_KEY, sessions)
}

export function getActiveTimer(): ActiveTimer {
  return readLocal<ActiveTimer>(ACTIVE_KEY, IDLE_TIMER)
}

function saveActiveTimer(timer: ActiveTimer) {
  writeLocal(ACTIVE_KEY, timer)
}

export function startTimer(project: string): ActiveTimer {
  const now = new Date().toISOString()
  const timer: ActiveTimer = {
    running: true,
    paused: false,
    project,
    notes: '',
    originalStart: now,
    segmentStart: now,
    accumulatedSeconds: 0,
  }
  saveActiveTimer(timer)
  return timer
}

export function pauseTimer(): ActiveTimer {
  const timer = getActiveTimer()
  if (!timer.running || timer.paused || !timer.segmentStart) return timer
  const elapsed = (Date.now() - new Date(timer.segmentStart).getTime()) / 1000
  const next: ActiveTimer = { ...timer, paused: true, segmentStart: null, accumulatedSeconds: timer.accumulatedSeconds + elapsed }
  saveActiveTimer(next)
  return next
}

export function resumeTimer(): ActiveTimer {
  const timer = getActiveTimer()
  if (!timer.running || !timer.paused) return timer
  const next: ActiveTimer = { ...timer, paused: false, segmentStart: new Date().toISOString() }
  saveActiveTimer(next)
  return next
}

export function currentElapsedSeconds(timer: ActiveTimer): number {
  if (!timer.running) return 0
  if (timer.paused || !timer.segmentStart) return timer.accumulatedSeconds
  return timer.accumulatedSeconds + (Date.now() - new Date(timer.segmentStart).getTime()) / 1000
}

/** Stops the active timer and saves it as a WorkSession with start/end/duration/notes. */
export function stopTimer(notes?: string): WorkSession | null {
  const timer = getActiveTimer()
  if (!timer.running || !timer.originalStart) return null
  const total = currentElapsedSeconds(timer)
  const now = new Date().toISOString()
  const session: WorkSession = {
    id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    project: timer.project,
    notes: notes ?? timer.notes,
    startTime: timer.originalStart,
    endTime: now,
    durationSeconds: Math.round(total),
    createdAt: now,
  }
  const sessions = getSessions()
  sessions.unshift(session)
  saveSessions(sessions)
  saveActiveTimer(IDLE_TIMER)
  return session
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function todaysTotalSeconds(projectFilter?: string): number {
  const sessions = getSessions().filter(
    s => s.startTime.slice(0, 10) === todayISO() && (!projectFilter || s.project === projectFilter)
  )
  const completed = sessions.reduce((sum, s) => sum + s.durationSeconds, 0)
  const active = getActiveTimer()
  const activeCountsToday =
    active.running &&
    active.originalStart !== null &&
    active.originalStart.slice(0, 10) === todayISO() &&
    (!projectFilter || active.project === projectFilter)
  return completed + (activeCountsToday ? currentElapsedSeconds(active) : 0)
}

/** "1h 24m" style summary, for totals. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  const sec = s % 60
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

/** "12:34" / "01:02:03" style live clock, for the running timer readout. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

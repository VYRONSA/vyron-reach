import type { DirectorThread } from '@/lib/marketingDirector/types'

export const DIRECTOR_CHAT_KEY = 'vyron-marketing-director-chat-v1'

export function loadDirectorThread(clientId: string | null): DirectorThread {
  if (typeof window === 'undefined') {
    return { clientId, messages: [], updatedAt: new Date().toISOString() }
  }
  try {
    const raw = localStorage.getItem(DIRECTOR_CHAT_KEY)
    if (!raw) return emptyThread(clientId)
    const all = JSON.parse(raw) as Record<string, DirectorThread>
    const key = clientId ?? '__agency__'
    return all[key] ?? emptyThread(clientId)
  } catch {
    return emptyThread(clientId)
  }
}

function emptyThread(clientId: string | null): DirectorThread {
  return { clientId, messages: [], updatedAt: new Date().toISOString() }
}

export function saveDirectorThread(thread: DirectorThread) {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(DIRECTOR_CHAT_KEY)
    const all = raw ? (JSON.parse(raw) as Record<string, DirectorThread>) : {}
    const key = thread.clientId ?? '__agency__'
    all[key] = { ...thread, updatedAt: new Date().toISOString() }
    localStorage.setItem(DIRECTOR_CHAT_KEY, JSON.stringify(all))
  } catch {
    /* ignore */
  }
}

export function clearDirectorThread(clientId: string | null) {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(DIRECTOR_CHAT_KEY)
    if (!raw) return
    const all = JSON.parse(raw) as Record<string, DirectorThread>
    const key = clientId ?? '__agency__'
    delete all[key]
    localStorage.setItem(DIRECTOR_CHAT_KEY, JSON.stringify(all))
  } catch {
    /* ignore */
  }
}

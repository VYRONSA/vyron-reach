'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useDevPreferences } from '@/context/dev/DevPreferencesContext'
import { getProjectBySlug } from '@/lib/dev/projectsData'
import { getTasks, toggleTaskComplete, type Task } from '@/lib/dev/queueStorage'
import { getCurrentMilestone, type Milestone } from '@/lib/dev/milestonesStorage'
import { getCurrentBatchForProject, type Batch } from '@/lib/dev/batchesStorage'
import { getPrompts, type Prompt } from '@/lib/dev/promptsStorage'
import { WorkSessionTimer } from './WorkSessionTimer'
import { DevBadge, DevCard, DevEmptyState } from './ui'

function mostRelevantPrompt(): Prompt | null {
  const prompts = getPrompts()
  const favourite = prompts.find(p => p.favourite)
  if (favourite) return favourite
  const [latest] = [...prompts].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
  return latest ?? null
}

export function FocusModeView() {
  const { preferences, setPreferences } = useDevPreferences()
  const slug = preferences.defaultProject
  const [hydrated, setHydrated] = useState(false)
  const [milestone, setMilestone] = useState<Milestone | null>(null)
  const [batch, setBatch] = useState<Batch | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [copied, setCopied] = useState(false)

  const refresh = () => {
    setMilestone(slug ? getCurrentMilestone(slug) : null)
    setBatch(slug ? getCurrentBatchForProject(slug) : null)
    setTasks(getTasks().filter(t => (!slug || t.project === slug) && t.status !== 'done'))
    setPrompt(mostRelevantPrompt())
    setHydrated(true)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const project = slug ? getProjectBySlug(slug) : undefined
  const exitFocusMode = () => setPreferences({ focusMode: false })

  const handleToggleTask = (id: string) => {
    toggleTaskComplete(id)
    refresh()
  }

  const handleCopyPrompt = async () => {
    if (!prompt) return
    try {
      await navigator.clipboard.writeText(prompt.content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable — no-op
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-10">
      <div className="flex w-full max-w-3xl items-center justify-between">
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--dev-accent)]">Focus Mode</div>
        <button
          type="button"
          onClick={exitFocusMode}
          className="rounded-lg border border-[var(--dev-border-strong)] px-3 py-1.5 text-xs font-medium text-[var(--dev-text-muted)] transition-colors hover:border-[var(--dev-accent)]/40 hover:text-[var(--dev-text)]"
        >
          Exit Focus Mode
        </button>
      </div>

      <div className="dev-fade-in mt-6 w-full max-w-3xl space-y-4">
        <DevCard eyebrow="Working on" title={project?.name ?? 'No default project set'}>
          {!hydrated ? (
            <div className="mt-2 text-sm text-[var(--dev-text-faint)]">Loading...</div>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-text-faint)]">Milestone</div>
                <div className="mt-1 text-sm text-[var(--dev-text)]">{milestone?.title ?? 'None set'}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-text-faint)]">Batch</div>
                <div className="mt-1 text-sm text-[var(--dev-text)]">{batch ? `Batch ${batch.batchNumber}` : 'None active'}</div>
              </div>
            </div>
          )}
        </DevCard>

        <DevCard eyebrow="Today" title="Today's Tasks">
          {!hydrated ? (
            <div className="mt-2 text-sm text-[var(--dev-text-faint)]">Loading...</div>
          ) : tasks.length === 0 ? (
            <DevEmptyState>Nothing open — enjoy the quiet.</DevEmptyState>
          ) : (
            <div className="mt-3 space-y-1.5">
              {tasks.map(task => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => handleToggleTask(task.id)}
                  aria-label={`Mark "${task.title}" complete`}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--dev-surface-hover)]"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[var(--dev-border-strong)] text-transparent hover:border-[var(--dev-accent)]">
                    ✓
                  </span>
                  <span className="flex-1 truncate text-sm text-[var(--dev-text)]">{task.title}</span>
                  <DevBadge tone={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'neutral'}>
                    {task.priority}
                  </DevBadge>
                </button>
              ))}
            </div>
          )}
        </DevCard>

        <WorkSessionTimer projectFilter={slug || undefined} />

        <DevCard eyebrow={prompt?.favourite ? 'Favourite prompt' : 'Latest prompt'} title="Current Prompt">
          {!hydrated ? (
            <div className="mt-2 text-sm text-[var(--dev-text-faint)]">Loading...</div>
          ) : !prompt ? (
            <DevEmptyState>No prompts saved yet.</DevEmptyState>
          ) : (
            <div className="mt-2">
              <div className="text-sm font-medium text-[var(--dev-text)]">{prompt.title}</div>
              <pre className="mt-2 max-h-28 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-black/20 p-2.5 font-mono text-[11.5px] leading-relaxed text-[var(--dev-text-muted)]">
                {prompt.content || '(empty)'}
              </pre>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="mt-2 rounded-lg border border-[var(--dev-border-strong)] px-3 py-1.5 text-xs font-medium text-[var(--dev-text-muted)] transition-colors hover:border-[var(--dev-accent)]/40 hover:text-[var(--dev-text)]"
              >
                {copied ? 'Copied' : 'Copy prompt'}
              </button>
            </div>
          )}
        </DevCard>

        <div className="pt-2 text-center">
          <Link href="/dev" onClick={exitFocusMode} className="text-xs text-[var(--dev-text-faint)] hover:text-[var(--dev-accent)]">
            &larr; Exit and return to the dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

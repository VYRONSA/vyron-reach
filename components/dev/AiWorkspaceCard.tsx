'use client'

import { useEffect, useState } from 'react'
import { getProjects } from '@/lib/dev/projectsData'
import {
  AI_STATUS_LABEL,
  getAiWorkspace,
  saveAiAssistant,
  type AiAssistantEntry,
  type AiAssistantStatus,
} from '@/lib/dev/aiWorkspaceStorage'
import { DevBadge, DevButton, DevInput, DevSelect, DevTextarea } from './ui'

const STATUS_TONE: Record<AiAssistantStatus, 'success' | 'neutral' | 'warning'> = {
  active: 'success',
  idle: 'neutral',
  blocked: 'warning',
}

function emptyEntry(): AiAssistantEntry {
  return {
    currentProject: '',
    currentObjective: '',
    lastSessionNotes: '',
    nextAction: '',
    status: 'idle',
    updatedAt: '',
  }
}

export function AiWorkspaceCard({
  assistant,
  name,
  role,
  gradient,
}: {
  assistant: 'claude' | 'chatgpt'
  name: string
  role: string
  gradient: string
}) {
  const [entry, setEntry] = useState<AiAssistantEntry>(emptyEntry())
  const [hydrated, setHydrated] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setEntry(getAiWorkspace()[assistant])
    setHydrated(true)
  }, [assistant])

  const handleSave = () => {
    saveAiAssistant(assistant, entry)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="rounded-2xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} font-mono text-sm font-bold text-white`}
          >
            {name.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--dev-text)]">{name}</div>
            <div className="text-xs text-[var(--dev-text-faint)]">{role}</div>
          </div>
        </div>
        <DevBadge tone={STATUS_TONE[entry.status]}>{AI_STATUS_LABEL[entry.status]}</DevBadge>
      </div>

      {!hydrated ? (
        <div className="mt-5 text-xs text-[var(--dev-text-faint)]">Loading...</div>
      ) : (
        <div className="mt-5 space-y-3.5">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--dev-text-muted)]">Current Project</label>
            <DevSelect
              value={entry.currentProject}
              onChange={e => setEntry(prev => ({ ...prev, currentProject: e.target.value }))}
            >
              <option value="">None</option>
              {getProjects().map(p => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </DevSelect>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--dev-text-muted)]">Current Objective</label>
            <DevInput
              value={entry.currentObjective}
              onChange={e => setEntry(prev => ({ ...prev, currentObjective: e.target.value }))}
              placeholder="What is this assistant working toward?"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--dev-text-muted)]">Last Session Notes</label>
            <DevTextarea
              value={entry.lastSessionNotes}
              onChange={e => setEntry(prev => ({ ...prev, lastSessionNotes: e.target.value }))}
              rows={3}
              placeholder="Summary of the last working session..."
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--dev-text-muted)]">Next Action</label>
            <DevInput
              value={entry.nextAction}
              onChange={e => setEntry(prev => ({ ...prev, nextAction: e.target.value }))}
              placeholder="What happens next session?"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--dev-text-muted)]">Status</label>
            <DevSelect
              value={entry.status}
              onChange={e => setEntry(prev => ({ ...prev, status: e.target.value as AiAssistantStatus }))}
            >
              <option value="active">Active</option>
              <option value="idle">Idle</option>
              <option value="blocked">Blocked</option>
            </DevSelect>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <DevButton onClick={handleSave}>Save</DevButton>
            {saved ? <span className="text-xs text-emerald-500 dark:text-emerald-400">Saved</span> : null}
            {entry.updatedAt ? (
              <span className="ml-auto text-[11px] text-[var(--dev-text-faint)]">
                Updated {new Date(entry.updatedAt).toLocaleString()}
              </span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

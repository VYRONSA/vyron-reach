'use client'

import { useState } from 'react'
import { getProjects } from '@/lib/dev/projectsData'
import { useDevPreferences } from '@/context/dev/DevPreferencesContext'
import { DevButton, DevCard, DevInput, DevSelect } from './ui'

export function SettingsForm() {
  const { preferences, hydrated, setPreferences } = useDevPreferences()
  const [displayName, setDisplayName] = useState(preferences.displayName)
  const [saved, setSaved] = useState(false)

  if (!hydrated) {
    return <div className="text-sm text-[var(--dev-text-faint)]">Loading preferences...</div>
  }

  const commitDisplayName = () => {
    setPreferences({ displayName: displayName.trim() })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  return (
    <DevCard eyebrow="Preferences" title="Developer Preferences">
      <div className="mt-4 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-[var(--dev-text)]">Theme</div>
            <div className="text-xs text-[var(--dev-text-faint)]">Applies across the entire portal</div>
          </div>
          <div className="flex gap-1 rounded-lg border border-[var(--dev-border-strong)] p-1">
            {(['dark', 'light'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setPreferences({ theme: t })}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  preferences.theme === t
                    ? 'bg-[var(--dev-accent-soft)] text-[var(--dev-accent)]'
                    : 'text-[var(--dev-text-faint)] hover:text-[var(--dev-text)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-[var(--dev-text)]">Sidebar collapsed</div>
            <div className="text-xs text-[var(--dev-text-faint)]">Also toggleable from the sidebar itself</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={preferences.sidebarCollapsed}
            onClick={() => setPreferences({ sidebarCollapsed: !preferences.sidebarCollapsed })}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              preferences.sidebarCollapsed ? 'bg-[var(--dev-accent)]' : 'bg-[var(--dev-border-strong)]'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                preferences.sidebarCollapsed ? 'translate-x-[22px]' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-[var(--dev-text)]">Default project</div>
            <div className="text-xs text-[var(--dev-text-faint)]">Shown on the Dashboard as Current Project</div>
          </div>
          <DevSelect
            value={preferences.defaultProject}
            onChange={e => setPreferences({ defaultProject: e.target.value })}
            className="w-48"
          >
            <option value="">None</option>
            {getProjects().map(p => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </DevSelect>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-[var(--dev-text)]">Auto-open last project</div>
            <div className="text-xs text-[var(--dev-text-faint)]">
              Surfaces a &quot;Continue&quot; quick action on the Dashboard
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={preferences.autoOpenLastProject}
            onClick={() => setPreferences({ autoOpenLastProject: !preferences.autoOpenLastProject })}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              preferences.autoOpenLastProject ? 'bg-[var(--dev-accent)]' : 'bg-[var(--dev-border-strong)]'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                preferences.autoOpenLastProject ? 'translate-x-[22px]' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="flex-1">
            <div className="mb-1 text-sm text-[var(--dev-text)]">Developer display name</div>
            <DevInput
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Shown in the sidebar"
            />
          </div>
          <DevButton onClick={commitDisplayName}>Save</DevButton>
        </div>
        {saved ? <div className="text-xs text-emerald-500 dark:text-emerald-400">Saved</div> : null}
      </div>
    </DevCard>
  )
}

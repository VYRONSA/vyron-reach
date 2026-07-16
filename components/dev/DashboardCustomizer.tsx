'use client'

import { useDevPreferences } from '@/context/dev/DevPreferencesContext'
import { DASHBOARD_WIDGET_LABELS, DEFAULT_DASHBOARD_WIDGET_ORDER, type DashboardWidgetId } from '@/lib/dev/preferences'
import { DevCard } from './ui'

export function DashboardCustomizer() {
  const { preferences, setPreferences } = useDevPreferences()
  const order = preferences.dashboardWidgetOrder.length ? preferences.dashboardWidgetOrder : DEFAULT_DASHBOARD_WIDGET_ORDER
  const hidden = new Set(preferences.dashboardHiddenWidgets)

  const move = (id: DashboardWidgetId, dir: -1 | 1) => {
    const idx = order.indexOf(id)
    const next = idx + dir
    if (next < 0 || next >= order.length) return
    const copy = [...order]
    ;[copy[idx], copy[next]] = [copy[next], copy[idx]]
    setPreferences({ dashboardWidgetOrder: copy })
  }

  const toggle = (id: DashboardWidgetId) => {
    const nextHidden = hidden.has(id)
      ? preferences.dashboardHiddenWidgets.filter(h => h !== id)
      : [...preferences.dashboardHiddenWidgets, id]
    setPreferences({ dashboardHiddenWidgets: nextHidden })
  }

  return (
    <DevCard className="mb-5" eyebrow="Layout" title="Customize dashboard widgets">
      <p className="mt-1 text-xs text-[var(--dev-text-faint)]">
        Hide widgets you don&apos;t need and reorder the rest. Saved to this browser.
      </p>
      <div className="mt-3 space-y-1">
        {order.map((id, idx) => (
          <div
            key={id}
            className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 hover:bg-[var(--dev-surface-hover)]"
          >
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => toggle(id)}
                role="switch"
                aria-checked={!hidden.has(id)}
                aria-label={hidden.has(id) ? `Show ${DASHBOARD_WIDGET_LABELS[id]}` : `Hide ${DASHBOARD_WIDGET_LABELS[id]}`}
                className={`flex h-5 w-5 items-center justify-center rounded border text-[10px] transition-colors ${
                  hidden.has(id)
                    ? 'border-[var(--dev-border-strong)] text-transparent'
                    : 'border-[var(--dev-accent)]/50 bg-[var(--dev-accent-soft)] text-[var(--dev-accent)]'
                }`}
              >
                ✓
              </button>
              <span className={`text-sm ${hidden.has(id) ? 'text-[var(--dev-text-faint)] line-through' : 'text-[var(--dev-text)]'}`}>
                {DASHBOARD_WIDGET_LABELS[id]}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(id, -1)}
                disabled={idx === 0}
                aria-label="Move up"
                className="flex h-6 w-6 items-center justify-center rounded text-[var(--dev-text-faint)] transition-colors hover:text-[var(--dev-text)] disabled:opacity-30"
              >
                &uarr;
              </button>
              <button
                type="button"
                onClick={() => move(id, 1)}
                disabled={idx === order.length - 1}
                aria-label="Move down"
                className="flex h-6 w-6 items-center justify-center rounded text-[var(--dev-text-faint)] transition-colors hover:text-[var(--dev-text)] disabled:opacity-30"
              >
                &darr;
              </button>
            </div>
          </div>
        ))}
      </div>
    </DevCard>
  )
}

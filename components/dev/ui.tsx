import type { ReactNode } from 'react'

export function DevPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-[var(--dev-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--dev-accent)]">
          {eyebrow}
        </div>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-[var(--dev-text)]">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--dev-text-muted)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function DevGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 ${className}`}>{children}</div>
}

export function DevCard({
  title,
  eyebrow,
  children,
  className = '',
}: {
  title?: string
  eyebrow?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_12px_28px_-14px_rgba(0,0,0,0.4)] ${className}`}
    >
      {eyebrow ? (
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-text-faint)]">
          {eyebrow}
        </div>
      ) : null}
      {title ? <div className="mt-1 text-sm font-medium text-[var(--dev-text)]">{title}</div> : null}
      {children}
    </div>
  )
}

export function DevStat({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string
  value: string
  hint?: string
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
}) {
  const toneClass: Record<string, string> = {
    neutral: 'text-[var(--dev-text)]',
    success: 'text-emerald-500 dark:text-emerald-400',
    warning: 'text-amber-500 dark:text-amber-400',
    danger: 'text-rose-500 dark:text-rose-400',
    info: 'text-[var(--dev-accent)]',
  }
  return (
    <div className="rounded-2xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-5">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-text-faint)]">
        {label}
      </div>
      <div className={`mt-2 font-mono text-xl font-semibold ${toneClass[tone]}`}>{value}</div>
      {hint ? <div className="mt-1 text-xs text-[var(--dev-text-faint)]">{hint}</div> : null}
    </div>
  )
}

export function DevBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
}) {
  const toneClass: Record<string, string> = {
    neutral: 'bg-[var(--dev-surface-hover)] text-[var(--dev-text-muted)] ring-[var(--dev-border-strong)]',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20',
    info: 'bg-[var(--dev-accent-soft)] text-[var(--dev-accent)] ring-[var(--dev-accent)]/20',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${toneClass[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}

export function DevRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--dev-border)] py-3 last:border-0">
      <span className="text-sm text-[var(--dev-text-muted)]">{label}</span>
      <span className="font-mono text-sm text-[var(--dev-text)]">{value}</span>
    </div>
  )
}

export function DevPlaceholderNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-6 flex items-start gap-2 rounded-xl border border-dashed border-[var(--dev-border-strong)] bg-[var(--dev-surface)]/40 px-4 py-3 text-xs text-[var(--dev-text-faint)]">
      <span className="font-mono text-[var(--dev-text-faint)]">/*</span>
      <span>{children}</span>
      <span className="font-mono text-[var(--dev-text-faint)]">*/</span>
    </p>
  )
}

export function DevButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  className = '',
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary' | 'danger'
  className?: string
  disabled?: boolean
}) {
  const variantClass: Record<string, string> = {
    primary: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:opacity-90',
    secondary:
      'border border-[var(--dev-border-strong)] text-[var(--dev-text-muted)] hover:text-[var(--dev-text)] hover:border-[var(--dev-accent)]/40',
    danger: 'border border-rose-500/30 text-rose-500 dark:text-rose-400 hover:bg-rose-500/10',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClass[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function DevInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props
  return (
    <input
      {...rest}
      className={`w-full rounded-lg border border-[var(--dev-border-strong)] bg-[var(--dev-input-bg)] px-3 py-2 text-sm text-[var(--dev-text)] outline-none placeholder:text-[var(--dev-text-faint)] focus:border-[var(--dev-accent)]/50 focus:ring-1 focus:ring-[var(--dev-accent)]/30 ${className}`}
    />
  )
}

export function DevTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', ...rest } = props
  return (
    <textarea
      {...rest}
      className={`w-full rounded-lg border border-[var(--dev-border-strong)] bg-[var(--dev-input-bg)] px-3 py-2 text-sm text-[var(--dev-text)] outline-none placeholder:text-[var(--dev-text-faint)] focus:border-[var(--dev-accent)]/50 focus:ring-1 focus:ring-[var(--dev-accent)]/30 ${className}`}
    />
  )
}

export function DevSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', children, ...rest } = props
  return (
    <select
      {...rest}
      className={`w-full rounded-lg border border-[var(--dev-border-strong)] bg-[var(--dev-input-bg)] px-3 py-2 text-sm text-[var(--dev-text)] outline-none focus:border-[var(--dev-accent)]/50 focus:ring-1 focus:ring-[var(--dev-accent)]/30 ${className}`}
    >
      {children}
    </select>
  )
}

export function DevTabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
}) {
  return (
    <div className="scrollbar-none flex gap-1 overflow-x-auto border-b border-[var(--dev-border)] pb-0">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`relative shrink-0 px-3.5 py-2.5 text-[13px] font-medium transition-colors ${
            active === tab.id
              ? 'text-[var(--dev-accent)]'
              : 'text-[var(--dev-text-faint)] hover:text-[var(--dev-text)]'
          }`}
        >
          {tab.label}
          {active === tab.id ? (
            <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-[var(--dev-accent)]" />
          ) : null}
        </button>
      ))}
    </div>
  )
}

export function DevEmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--dev-border-strong)] px-4 py-8 text-center text-sm text-[var(--dev-text-faint)]">
      {children}
    </div>
  )
}

export function DevSkeleton({ className = '' }: { className?: string }) {
  return <div className={`dev-skeleton rounded-md ${className}`} />
}

/**
 * A labelled data field inside a DevCard — label in small uppercase
 * caps, value below. Shared by every intelligence card (Development
 * Session, Development Plan, Git/Deployment/Build Intelligence) instead
 * of each one defining its own identical local component.
 */
export function DevField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-text-faint)]">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  )
}

/**
 * The accent-coloured section title row used at the top of every
 * intelligence card, with an optional trailing badge (e.g. a readiness
 * indicator). Shared so Git/Deployment/Build Intelligence and the
 * Development Plan panel don't each hand-roll the same header markup.
 */
export function DevCardHeader({ title, badge }: { title: string; badge?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--dev-accent)]">{title}</div>
      {badge}
    </div>
  )
}

/** A bare, muted section heading dividing groups of DevFields inside a larger card (e.g. the Executive Command Centre's Git/Build/Deployment groupings). */
export function DevSectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-text-faint)]">{children}</div>
  )
}

export type DevReadiness = 'Ready' | 'Needs Review' | 'Blocked'

/** Shared tone mapping for the Ready / Needs Review / Blocked readiness enum every intelligence engine produces. */
export function devReadinessTone(readiness: DevReadiness): 'success' | 'warning' | 'danger' {
  if (readiness === 'Ready') return 'success'
  if (readiness === 'Needs Review') return 'warning'
  return 'danger'
}

/** Shared tone mapping for Passing / Failing / Unknown validation-style statuses (build, TypeScript, runtime). */
export function devValidationTone(status: string): 'success' | 'neutral' | 'danger' {
  if (status === 'Passing') return 'success'
  if (status === 'Unknown') return 'neutral'
  return 'danger'
}

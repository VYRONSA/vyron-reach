import type { ReactNode } from 'react'

export function PayPageHeader({
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
    <div className="mb-8 flex flex-col gap-4 border-b border-[var(--pay-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--pay-accent)]">
          {eyebrow}
        </div>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-[var(--pay-text)]">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--pay-text-muted)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function PayGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 ${className}`}>{children}</div>
}

export function PayCard({
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
      className={`rounded-2xl border border-[var(--pay-border)] bg-[var(--pay-surface)] p-5 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_12px_28px_-18px_rgba(15,23,42,0.25)] ${className}`}
    >
      {eyebrow ? (
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pay-text-faint)]">
          {eyebrow}
        </div>
      ) : null}
      {title ? <div className="mt-1 text-sm font-medium text-[var(--pay-text)]">{title}</div> : null}
      {children}
    </div>
  )
}

export function PayStat({
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
    neutral: 'text-[var(--pay-text)]',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-rose-600',
    info: 'text-[var(--pay-accent)]',
  }
  return (
    <div className="rounded-2xl border border-[var(--pay-border)] bg-[var(--pay-surface)] p-5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pay-text-faint)]">
        {label}
      </div>
      <div className={`mt-2 text-xl font-semibold ${toneClass[tone]}`}>{value}</div>
      {hint ? <div className="mt-1 text-xs text-[var(--pay-text-faint)]">{hint}</div> : null}
    </div>
  )
}

export function PayBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
}) {
  const toneClass: Record<string, string> = {
    neutral: 'bg-[var(--pay-surface-hover)] text-[var(--pay-text-muted)] ring-[var(--pay-border-strong)]',
    success: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-700 ring-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-700 ring-rose-500/20',
    info: 'bg-[var(--pay-accent-soft)] text-[var(--pay-accent)] ring-[var(--pay-accent)]/20',
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

export function PayRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--pay-border)] py-3 last:border-0">
      <span className="text-sm text-[var(--pay-text-muted)]">{label}</span>
      <span className="text-sm text-[var(--pay-text)]">{value}</span>
    </div>
  )
}

export function PayEmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--pay-border-strong)] px-4 py-8 text-center text-sm text-[var(--pay-text-faint)]">
      {children}
    </div>
  )
}

export function PayButton({
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
    primary: 'bg-[var(--pay-accent)] text-white hover:bg-[var(--pay-accent-strong)]',
    secondary:
      'border border-[var(--pay-border-strong)] text-[var(--pay-text-muted)] hover:text-[var(--pay-text)] hover:border-[var(--pay-accent)]/40',
    danger: 'border border-rose-500/30 text-rose-600 hover:bg-rose-500/10',
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

export function PayInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props
  return (
    <input
      {...rest}
      className={`w-full rounded-lg border border-[var(--pay-border-strong)] bg-[var(--pay-input-bg)] px-3 py-2 text-sm text-[var(--pay-text)] outline-none placeholder:text-[var(--pay-text-faint)] focus:border-[var(--pay-accent)]/50 focus:ring-1 focus:ring-[var(--pay-accent)]/30 ${className}`}
    />
  )
}

export function PaySelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', children, ...rest } = props
  return (
    <select
      {...rest}
      className={`w-full rounded-lg border border-[var(--pay-border-strong)] bg-[var(--pay-input-bg)] px-3 py-2 text-sm text-[var(--pay-text)] outline-none focus:border-[var(--pay-accent)]/50 focus:ring-1 focus:ring-[var(--pay-accent)]/30 ${className}`}
    >
      {children}
    </select>
  )
}

export function PayField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pay-text-faint)]">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  )
}

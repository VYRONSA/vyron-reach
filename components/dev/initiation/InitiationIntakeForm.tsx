'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DevButton, DevCard, DevField, DevInput, DevTextarea } from '../ui'
import type { InitiationRequest } from '@/lib/dev/initiation/initiationTypes'

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/**
 * Step 1 of the Project Initiation wizard: the free-text Executive
 * Directive intake. Submitting creates a Draft InitiationRequest (which
 * also reserves the project slug server-side) and redirects into
 * /dev/initiation/[id], which drives every subsequent step.
 */
export function InitiationIntakeForm() {
  const router = useRouter()
  const [directiveTitle, setDirectiveTitle] = useState('')
  const [projectSlug, setProjectSlug] = useState('')
  const [projectCategory, setProjectCategory] = useState('')
  const [directiveText, setDirectiveText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const derivedSlug = projectSlug.trim() ? slugify(projectSlug) : slugify(directiveTitle)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!directiveTitle.trim() || !directiveText.trim()) {
      setError('A title and the Executive Directive text are both required.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/dev/initiation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directiveTitle,
          directiveText,
          projectSlug: projectSlug.trim() || undefined,
          projectCategory: projectCategory.trim() || undefined,
        }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error ?? `Failed to submit directive (${res.status}).`)
        setSubmitting(false)
        return
      }
      const initiation = body.initiation as InitiationRequest
      router.push(`/dev/initiation/${initiation.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit directive.')
      setSubmitting(false)
    }
  }

  return (
    <DevCard>
      <form onSubmit={handleSubmit} className="space-y-5">
        <DevField label="Directive Title">
          <DevInput
            value={directiveTitle}
            onChange={e => setDirectiveTitle(e.target.value)}
            placeholder="e.g. Customer Loyalty Rewards Programme"
          />
        </DevField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DevField label="Project Slug (optional — derived from title if left blank)">
            <DevInput value={projectSlug} onChange={e => setProjectSlug(e.target.value)} placeholder={slugify(directiveTitle) || 'auto-generated'} />
            {derivedSlug ? <p className="mt-1 text-xs text-[var(--dev-text-faint)]">Will reserve: {derivedSlug}</p> : null}
          </DevField>
          <DevField label="Category (optional)">
            <DevInput value={projectCategory} onChange={e => setProjectCategory(e.target.value)} placeholder="e.g. Consumer, Internal Tooling" />
          </DevField>
        </div>

        <DevField label="Executive Directive">
          <DevTextarea
            value={directiveText}
            onChange={e => setDirectiveText(e.target.value)}
            rows={12}
            placeholder="Describe what to build in as much detail as you have — the objective, constraints, target users, anything already decided. This becomes the sole input to the engineering assessment and programme generation."
          />
        </DevField>

        {error ? <p className="text-sm text-rose-500 dark:text-rose-400">{error}</p> : null}

        <div className="flex justify-end">
          <DevButton type="submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Executive Directive'}
          </DevButton>
        </div>
      </form>
    </DevCard>
  )
}

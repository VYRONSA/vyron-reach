'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent, type ReactNode } from 'react'
import {
  createProject,
  isSlugTaken,
  suggestSlug,
  updateProject,
  type Project,
  type ProjectInput,
  type ProjectStatus,
} from '@/lib/dev/projectsData'
import { DevButton, DevInput, DevSelect, DevTextarea } from '../ui'

const STATUS_OPTIONS: ProjectStatus[] = ['planning', 'active', 'paused', 'complete']

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-text-faint)]">
        {label}
      </div>
      {children}
    </label>
  )
}

type FormState = {
  name: string
  slug: string
  description: string
  category: string
  status: ProjectStatus
  progress: number
  color: string
  icon: string
}

function fromProject(project: Project): FormState {
  return {
    name: project.name,
    slug: project.slug,
    description: project.description,
    category: project.category,
    status: project.status,
    progress: project.progress,
    color: project.color,
    icon: project.icon,
  }
}

const emptyForm: FormState = {
  name: '',
  slug: '',
  description: '',
  category: '',
  status: 'planning',
  progress: 0,
  color: '',
  icon: '',
}

/**
 * Create/edit form for Project Administration. Slug is editable only on
 * create (auto-suggested from the name) — once a project exists, its
 * slug must stay stable so existing links/bookmarks never break.
 */
export function AdminProjectForm({ project }: { project?: Project }) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(project ? fromProject(project) : emptyForm)
  const [slugTouched, setSlugTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = Boolean(project)

  const handleNameChange = (name: string) => {
    setForm(prev => ({
      ...prev,
      name,
      slug: isEdit || slugTouched ? prev.slug : suggestSlug(name),
    }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.name.trim()) {
      setError('Project Name is required.')
      return
    }
    if (!form.slug.trim()) {
      setError('Slug is required.')
      return
    }

    if (isEdit && project) {
      updateProject(project.slug, {
        name: form.name,
        description: form.description,
        category: form.category,
        status: form.status,
        progress: form.progress,
        color: form.color,
        icon: form.icon,
      })
      router.push(`/dev/admin/projects/${project.slug}`)
      router.refresh()
      return
    }

    if (isSlugTaken(form.slug.trim())) {
      setError(`Slug "${form.slug}" is already in use by another project.`)
      return
    }

    const input: ProjectInput = {
      name: form.name,
      slug: form.slug.trim(),
      description: form.description,
      category: form.category,
      status: form.status,
      progress: form.progress,
      color: form.color,
      icon: form.icon,
    }
    const created = createProject(input)
    router.push(`/dev/admin/projects/${created.slug}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-6">
      {!isEdit ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          This creates a project record only — no engineering assessment, milestones, or delivery batches. For the full assessed-and-approved
          path, use{' '}
          <Link href="/dev/initiation/new" className="underline underline-offset-2">
            Project Initiation
          </Link>{' '}
          instead.
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Project Name">
          <DevInput value={form.name} onChange={e => handleNameChange(e.target.value)} required />
        </Field>
        <Field label="Slug">
          <DevInput
            value={form.slug}
            onChange={e => {
              setSlugTouched(true)
              setForm(prev => ({ ...prev, slug: e.target.value }))
            }}
            disabled={isEdit}
            required
          />
        </Field>
      </div>

      <Field label="Description">
        <DevTextarea rows={3} value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Product Category">
          <DevInput value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))} />
        </Field>
        <Field label="Status">
          <DevSelect value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value as ProjectStatus }))}>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </DevSelect>
        </Field>
        <Field label="Progress (%)">
          <DevInput
            type="number"
            min={0}
            max={100}
            value={form.progress}
            onChange={e => setForm(prev => ({ ...prev, progress: Number(e.target.value) }))}
          />
        </Field>
      </div>
      <p className="text-xs text-[var(--dev-text-faint)]">
        Current Phase and Current Milestone are no longer set here — both are derived automatically from the project&apos;s
        milestones.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Colour (optional)">
          <DevInput
            value={form.color}
            onChange={e => setForm(prev => ({ ...prev, color: e.target.value }))}
            placeholder="#38bdf8"
          />
        </Field>
        <Field label="Icon (optional)">
          <DevInput value={form.icon} onChange={e => setForm(prev => ({ ...prev, icon: e.target.value }))} placeholder="rocket" />
        </Field>
      </div>

      {error ? <p className="text-sm text-rose-500 dark:text-rose-400">{error}</p> : null}

      <div className="flex items-center gap-2 border-t border-[var(--dev-border)] pt-4">
        <DevButton type="submit">{isEdit ? 'Save Changes' : 'Create Project'}</DevButton>
      </div>
    </form>
  )
}

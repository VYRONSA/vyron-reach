'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type ContentItem = {
  id: string
  title: string
  platform: string
  status: string
  publish_date: string | null
  content_type: string | null
  notes: string | null
  created_at: string
}

const platforms = ['LinkedIn', 'Facebook', 'Instagram', 'TikTok', 'Email', 'Website']
const statuses = ['planned', 'drafting', 'ready', 'published']
const contentTypes = ['Post', 'Carousel', 'Video', 'Email', 'Blog', 'Ad']

export default function ContentPlannerPage() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)

  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState('LinkedIn')
  const [status, setStatus] = useState('planned')
  const [publishDate, setPublishDate] = useState('')
  const [contentType, setContentType] = useState('Post')
  const [notes, setNotes] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    loadContent()
  }, [])

  async function loadContent() {
    setLoading(true)
    const { data } = await supabase
      .from('content_items')
      .select('*')
      .order('publish_date', { ascending: true })

    setItems(data || [])
    setLoading(false)
  }

  async function saveContent() {
    if (!title.trim()) return

    const payload = {
      title: title.trim(),
      platform,
      status,
      publish_date: publishDate || null,
      content_type: contentType,
      notes: notes.trim() || null,
    }

    if (editingId) {
      await supabase.from('content_items').update(payload).eq('id', editingId)
    } else {
      await supabase.from('content_items').insert([payload])
    }

    resetForm()
    loadContent()
  }

  function editItem(item: ContentItem) {
    setEditingId(item.id)
    setTitle(item.title || '')
    setPlatform(item.platform || 'LinkedIn')
    setStatus(item.status || 'planned')
    setPublishDate(item.publish_date || '')
    setContentType(item.content_type || 'Post')
    setNotes(item.notes || '')
  }

  async function deleteItem(id: string) {
    await supabase.from('content_items').delete().eq('id', id)
    loadContent()
  }

  function resetForm() {
    setEditingId(null)
    setTitle('')
    setPlatform('LinkedIn')
    setStatus('planned')
    setPublishDate('')
    setContentType('Post')
    setNotes('')
  }

  const stats = useMemo(() => {
    return {
      total: items.length,
      planned: items.filter(i => i.status === 'planned').length,
      ready: items.filter(i => i.status === 'ready').length,
      published: items.filter(i => i.status === 'published').length,
    }
  }, [items])

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold tracking-[0.3em] text-purple-500">VYRON REACH</p>
          <h1 className="mt-3 text-4xl font-black text-slate-950">Content Planner</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-500">
            Plan, draft, schedule and track marketing content across every platform.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total Content" value={stats.total} />
          <StatCard label="Planned" value={stats.planned} />
          <StatCard label="Ready" value={stats.ready} />
          <StatCard label="Published" value={stats.published} />
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm xl:col-span-1">
            <h2 className="text-xl font-black text-slate-950">
              {editingId ? 'Edit Content' : 'Add Content'}
            </h2>
            <p className="mb-5 text-sm text-slate-500">
              Create a content item for your marketing calendar.
            </p>

            <div className="space-y-4">
              <Input label="Title" value={title} onChange={setTitle} placeholder="Example: LinkedIn launch post" />

              <Select label="Platform" value={platform} onChange={setPlatform} options={platforms} />

              <Select label="Status" value={status} onChange={setStatus} options={statuses} />

              <Select label="Content Type" value={contentType} onChange={setContentType} options={contentTypes} />

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Publish Date</label>
                <input
                  type="date"
                  value={publishDate}
                  onChange={e => setPublishDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Caption idea, angle, hook, offer or call-to-action..."
                  rows={5}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={saveContent}
                  className="flex-1 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
                >
                  {editingId ? 'Save Changes' : 'Add Content'}
                </button>

                {editingId && (
                  <button
                    onClick={resetForm}
                    className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm xl:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950">Marketing Calendar</h2>
                <p className="text-sm text-slate-500">Your latest planned content.</p>
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-slate-100 p-6 text-sm text-slate-500">
                Loading content...
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-sm text-slate-500">
                No content yet. Add your first content item.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="rounded-2xl border border-slate-100 p-5">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black text-slate-950">{item.title}</h3>
                          <StatusPill status={item.status} />
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                          {item.platform} • {item.content_type || 'Content'} • {item.publish_date || 'No date set'}
                        </p>

                        {item.notes && (
                          <p className="mt-3 text-sm text-slate-600">{item.notes}</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => editItem(item)}
                          className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-3 text-4xl font-black text-slate-950">{value}</p>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-purple-400"
      />
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-purple-400"
      >
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const className =
    status === 'published'
      ? 'bg-green-50 text-green-700'
      : status === 'ready'
      ? 'bg-blue-50 text-blue-700'
      : status === 'drafting'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-slate-100 text-slate-700'

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${className}`}>
      {status}
    </span>
  )
}
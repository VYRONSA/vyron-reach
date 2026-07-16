'use client'

import { useEffect, useState } from 'react'
import { getProductBible, PRODUCT_BIBLE_FIELDS, saveProductBible, type ProductBible } from '@/lib/dev/productBibleStorage'
import { renderMarkdownLite } from '@/lib/dev/markdownLite'
import { DevButton, DevCard, DevTextarea } from './ui'

function emptyBible(): ProductBible {
  return { vision: '', goals: '', targetMarket: '', coreFeatures: '', futureRoadmap: '', notes: '', updatedAt: '' }
}

export function ProductBibleEditor({ projectSlug }: { projectSlug: string }) {
  const [bible, setBible] = useState<ProductBible>(emptyBible())
  const [hydrated, setHydrated] = useState(false)
  const [mode, setMode] = useState<'write' | 'preview'>('write')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setBible(getProductBible(projectSlug))
    setHydrated(true)
  }, [projectSlug])

  const handleSave = () => {
    const record = saveProductBible(projectSlug, bible)
    setBible(record)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  if (!hydrated) return <div className="text-sm text-[var(--dev-text-faint)]">Loading product bible...</div>

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-[var(--dev-border-strong)] p-1">
          <button
            type="button"
            onClick={() => setMode('write')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              mode === 'write' ? 'bg-[var(--dev-accent-soft)] text-[var(--dev-accent)]' : 'text-[var(--dev-text-faint)] hover:text-[var(--dev-text)]'
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              mode === 'preview' ? 'bg-[var(--dev-accent-soft)] text-[var(--dev-accent)]' : 'text-[var(--dev-text-faint)] hover:text-[var(--dev-text)]'
            }`}
          >
            Preview
          </button>
        </div>
        <div className="flex items-center gap-3">
          {saved ? <span className="text-xs text-emerald-500 dark:text-emerald-400">Saved</span> : null}
          {bible.updatedAt ? (
            <span className="text-[11px] text-[var(--dev-text-faint)]">
              Last saved {new Date(bible.updatedAt).toLocaleString()}
            </span>
          ) : null}
          <DevButton onClick={handleSave}>Save</DevButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {PRODUCT_BIBLE_FIELDS.map(field => (
          <DevCard key={field.key} eyebrow={field.label}>
            <div className="mt-2">
              {mode === 'write' ? (
                <DevTextarea
                  value={bible[field.key]}
                  onChange={e => setBible(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={5}
                  className="font-mono text-[13px] leading-relaxed"
                />
              ) : bible[field.key].trim() ? (
                renderMarkdownLite(bible[field.key])
              ) : (
                <div className="text-sm text-[var(--dev-text-faint)]">Nothing written yet.</div>
              )}
            </div>
          </DevCard>
        ))}
      </div>
    </div>
  )
}

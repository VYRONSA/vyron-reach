'use client'

import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { useVyronData } from '@/context/VyronDataContext'
import { CreativeFullscreenModal } from '@/components/owner/CreativeFullscreenModal'
import { CreativeRevisionModal } from '@/components/owner/CreativeRevisionModal'
import { isAcceptedCreativeFile, uploadCreativeImage } from '@/lib/creativeUpload/storage'
import { getPlatformLaunchUrl } from '@/lib/creativeUpload/platformLinks'
import type { VyronUploadedCreative } from '@/lib/vyronStore/types'

const STATUS_STYLES: Record<VyronUploadedCreative['status'], string> = {
  'Pending Review': 'bg-amber-100 text-amber-900 ring-amber-200',
  Approved: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
  'Needs Revision': 'bg-violet-100 text-violet-900 ring-violet-200',
  Rejected: 'bg-red-100 text-red-900 ring-red-200',
}

export function CreativeUploadPanel({
  clientId,
  clientName,
  platform,
  campaignGoal,
  chatgptNotes,
  defaultCaption,
  defaultCta,
  onToast,
}: {
  clientId: string
  clientName: string
  platform: string
  campaignGoal: string
  chatgptNotes: string
  defaultCaption: string
  defaultCta: string
  onToast: (msg: string) => void
}) {
  const {
    store,
    addUploadedCreative,
    approveUploadedCreative,
    rejectUploadedCreative,
    requestUploadedCreativeRevision,
    setFinalUploadedCreative,
    addToActionQueue,
  } = useVyronData()

  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [revisionTarget, setRevisionTarget] = useState<VyronUploadedCreative | null>(null)
  const [fullscreen, setFullscreen] = useState<VyronUploadedCreative | null>(null)

  const campaignCreatives = useMemo(
    () =>
      store.uploadedCreatives.filter(
        u => u.clientId === clientId && u.platform === platform && u.campaignGoal === campaignGoal,
      ),
    [store.uploadedCreatives, clientId, platform, campaignGoal],
  )

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter(isAcceptedCreativeFile)
      if (!list.length) {
        onToast('Use PNG, JPG, or WebP under 8MB')
        return
      }
      setUploading(true)
      const baseCount = campaignCreatives.length
      try {
        for (let i = 0; i < list.length; i++) {
          const file = list[i]
          const { imageUrl, storagePath, usedSupabase } = await uploadCreativeImage(file, clientId)
          addUploadedCreative({
            clientId,
            clientName,
            platform,
            campaignGoal,
            variationName: `Variation ${baseCount + i + 1}`,
            imageUrl,
            storagePath,
            status: 'Pending Review',
            isFinalCampaignCreative: false,
            caption: defaultCaption,
            cta: defaultCta,
            chatgptNotes,
            revisionNotes: {},
            revisionPrompt: '',
          })
          if (!usedSupabase) {
            onToast('Saved locally — configure Supabase bucket for cloud storage')
          }
        }
        onToast(`${list.length} creative(s) uploaded`)
      } catch (e) {
        onToast(e instanceof Error ? e.message : 'Upload failed')
      } finally {
        setUploading(false)
      }
    },
    [
      addUploadedCreative,
      campaignCreatives.length,
      campaignGoal,
      chatgptNotes,
      clientId,
      clientName,
      defaultCaption,
      defaultCta,
      onToast,
      platform,
    ],
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    void processFiles(e.dataTransfer.files)
  }

  const downloadImage = async (c: VyronUploadedCreative) => {
    try {
      const res = await fetch(c.imageUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${c.variationName.replace(/\s+/g, '-')}-${c.clientName}.png`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(c.imageUrl, '_blank')
    }
  }

  const queueLaunch = (c: VyronUploadedCreative) => {
    addToActionQueue({
      title: `Launch ${c.platform} — ${c.clientName}`,
      subtitle: c.variationName,
      sourcePage: 'ai-marketing-director',
      department: 'ai-marketing-director',
      priority: 'High',
      due: 'This week',
      executionBrief: `Deploy approved creative for ${c.campaignGoal}`,
      nextSteps: [
        'Upload image to ad platform',
        'Paste caption and CTA',
        'Set targeting and budget',
        'Mark live in VYRON REACH',
      ],
      outputNeeded: `Live ${c.platform} campaign`,
      kind: 'advert_image',
      notes: c.caption || c.chatgptNotes.slice(0, 300),
      generatedOutput: '',
    })
    onToast('Added to action queue')
  }

  return (
    <div className="space-y-8">
      <div
        onDragOver={e => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative overflow-hidden rounded-[28px] border-2 border-dashed p-8 text-center transition ${
          dragOver
            ? 'border-violet-400 bg-violet-50/80'
            : 'border-slate-200/80 bg-gradient-to-br from-white/80 via-violet-50/30 to-slate-50/80 backdrop-blur-sm'
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_55%)]" />
        <div className="relative">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-600">Upload creatives</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">Upload ChatGPT-generated advert creatives</h3>
          <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-slate-500">
            Drag & drop PNG, JPG, or WebP — multiple variations supported. Stored in Supabase{' '}
            <code className="rounded bg-slate-100 px-1 text-xs">marketing-creatives</code> when configured.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={e => e.target.files && void processFiles(e.target.files)}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="mt-6 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-10 py-4 text-sm font-black uppercase tracking-wide text-white shadow-lg disabled:opacity-60"
          >
            {uploading ? 'Uploading…' : 'Choose images'}
          </button>
        </div>
      </div>

      {campaignCreatives.length > 0 ? (
        <div>
          <h3 className="text-lg font-black text-slate-950">Creative review</h3>
          <p className="mt-1 text-sm text-slate-500">{campaignCreatives.length} variation(s) for this campaign</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {campaignCreatives.map(c => (
              <article
                key={c.id}
                className="overflow-hidden rounded-[24px] border border-white/60 bg-white/70 shadow-lg ring-1 ring-slate-100/80 backdrop-blur-md"
              >
                <button type="button" onClick={() => setFullscreen(c)} className="relative block w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.imageUrl}
                    alt={c.variationName}
                    className="aspect-[4/5] w-full object-cover sm:aspect-square"
                  />
                  {c.isFinalCampaignCreative ? (
                    <span className="absolute left-3 top-3 rounded-full bg-violet-600 px-2.5 py-1 text-[9px] font-black uppercase text-white">
                      Final creative
                    </span>
                  ) : null}
                </button>
                <div className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-black text-slate-900">{c.variationName}</p>
                      <p className="text-[10px] font-semibold text-slate-400">
                        {new Date(c.createdAt).toLocaleString('en-ZA', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ring-1 ${STATUS_STYLES[c.status]}`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <CardBtn primary onClick={() => approveUploadedCreative(c.id)}>
                      Approve
                    </CardBtn>
                    <CardBtn onClick={() => rejectUploadedCreative(c.id)}>Reject</CardBtn>
                    <CardBtn onClick={() => setRevisionTarget(c)}>Revision notes</CardBtn>
                    <CardBtn onClick={() => setFullscreen(c)}>Fullscreen</CardBtn>
                    <CardBtn
                      onClick={() => {
                        setFinalUploadedCreative(c.id)
                        onToast('Set as final campaign creative')
                      }}
                      className="col-span-2"
                    >
                      Set as final campaign creative
                    </CardBtn>
                  </div>
                  {c.status === 'Approved' ? (
                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                      <CardBtn onClick={() => void downloadImage(c)}>Download</CardBtn>
                      <CardBtn onClick={() => void navigator.clipboard.writeText(c.caption).then(() => onToast('Caption copied'))}>
                        Copy caption
                      </CardBtn>
                      <CardBtn onClick={() => void navigator.clipboard.writeText(c.cta).then(() => onToast('CTA copied'))}>
                        Copy CTA
                      </CardBtn>
                      <CardBtn onClick={() => window.open(getPlatformLaunchUrl(c.platform), '_blank')}>
                        Open {c.platform}
                      </CardBtn>
                      <CardBtn onClick={() => queueLaunch(c)} className="col-span-2">
                        Add to campaign queue
                      </CardBtn>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {revisionTarget ? (
        <CreativeRevisionModal
          creative={revisionTarget}
          onClose={() => setRevisionTarget(null)}
          onSave={(notes, prompt) => {
            requestUploadedCreativeRevision(revisionTarget.id, notes, prompt)
            setRevisionTarget(null)
            onToast('Marked needs revision')
          }}
          onCopyPrompt={prompt => {
            void navigator.clipboard.writeText(prompt)
            onToast('Revision prompt copied — paste in ChatGPT')
          }}
        />
      ) : null}

      {fullscreen ? (
        <CreativeFullscreenModal creative={fullscreen} onClose={() => setFullscreen(null)} />
      ) : null}
    </div>
  )
}

function CardBtn({
  children,
  onClick,
  primary,
  className = '',
}: {
  children: ReactNode
  onClick: () => void
  primary?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-2 py-2.5 text-[10px] font-black uppercase tracking-wide ${
        primary ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      } ${className}`}
    >
      {children}
    </button>
  )
}

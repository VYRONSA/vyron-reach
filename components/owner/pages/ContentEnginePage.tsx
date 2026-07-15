'use client'

import { useEffect, useState } from 'react'
import { useAppNavigation } from '@/context/AppNavigationContext'
import { useVyronData } from '@/context/VyronDataContext'
import { generateAdvertImagePrompt } from '@/lib/advertPromptGenerator'
import { buildOwnerDrill } from '@/lib/ownerDrill'
import type { AdvertPlatform, AdvertStyle, VyronContentTask } from '@/lib/vyronStore/types'
import { ExecutionPrefillBanner } from '@/components/owner/ExecutionPrefillBanner'
import { OpenCreativeStudioButton } from '@/components/owner/OpenCreativeStudioButton'
import { MarketingMaterialStudio } from '@/components/owner/MarketingMaterialStudio'
import { OwnerCard, OwnerEmptyState, OwnerPageShell, OwnerStatGrid, ClickableRow } from '@/components/owner/OwnerPageShell'

const PLATFORMS: AdvertPlatform[] = ['Facebook', 'Instagram', 'WhatsApp', 'LinkedIn', 'Google Display']
const STYLES: AdvertStyle[] = ['Premium SaaS', 'Bold Social', 'Corporate', 'Futuristic', 'Minimal']

export function ContentEnginePage() {
  const { openDrill, executionPrefill } = useAppNavigation()
  const { store, addAdvertConcept, deleteAdvertConcept, addContentTask } = useVyronData()
  const { contentTasks, advertConcepts, settings, keywords } = store

  const [showContentForm, setShowContentForm] = useState(false)
  const [contentTitle, setContentTitle] = useState('')
  const [contentType, setContentType] = useState<VyronContentTask['type']>('Landing Page')
  const [contentKeyword, setContentKeyword] = useState(keywords[0]?.keyword ?? '')

  const [productName, setProductName] = useState(settings.defaultProject)
  const [targetAudience, setTargetAudience] = useState('South African business owners and operations managers')
  const [platform, setPlatform] = useState<AdvertPlatform>('Facebook')
  const [offerMessage, setOfferMessage] = useState('Stop losing payroll hours — manage your workforce in one command centre')
  const [style, setStyle] = useState<AdvertStyle>('Premium SaaS')

  const ready = contentTasks.filter(t => t.status === 'Ready' || t.status === 'Published').length

  useEffect(() => {
    if (executionPrefill?.marketingStudio) {
      const m = executionPrefill.marketingStudio
      setProductName(m.productName)
      setTargetAudience(m.targetAudience)
      setPlatform(m.platform as AdvertPlatform)
      setOfferMessage(m.offerMessage)
      setStyle(m.tone as AdvertStyle)
    }
  }, [executionPrefill])

  const generateAdvert = () => {
    const prompt = generateAdvertImagePrompt({
      productName: productName.trim() || settings.defaultProject,
      targetAudience: targetAudience.trim(),
      platform,
      offerMessage: offerMessage.trim(),
      style,
    })
    const concept = addAdvertConcept({
      productName: productName.trim() || settings.defaultProject,
      targetAudience: targetAudience.trim(),
      platform,
      offerMessage: offerMessage.trim(),
      style,
      prompt,
    })
    openDrill(
      buildOwnerDrill(
        `${concept.platform} — ${concept.productName}`,
        'AI advert image prompt ready for image generator',
        'Content Engine',
        [
          { label: 'Platform', value: concept.platform },
          { label: 'Style', value: concept.style },
          { label: 'Audience', value: concept.targetAudience },
        ],
        [
          'Copy prompt into Midjourney, DALL·E or your image tool',
          concept.prompt,
          'Export creative for client approval',
        ],
        undefined,
        {
          department: 'Content Engine',
          kind: 'advert_image',
          outputNeeded: 'Exported advert image file approved for paid social',
          advertMeta: {
            prompt: concept.prompt,
            platform: concept.platform,
            audience: concept.targetAudience,
            style: concept.style,
            productName: concept.productName,
            offerMessage: concept.offerMessage,
          },
        },
      ),
    )
  }

  return (
    <OwnerPageShell
      eyebrow="Content Production · Ranking Assets"
      title="Content Engine"
      subtitle="Content publishing queue and AI Advert Image Studio for paid social creatives."
      theme="content"
    >
      <OwnerStatGrid
        stats={[
          { label: 'Content Queue', value: String(contentTasks.length), color: '#d946ef' },
          { label: 'Ready', value: String(ready), color: '#10b981' },
          { label: 'Ad Concepts', value: String(advertConcepts.length), color: '#ec4899' },
          { label: 'Project', value: settings.defaultProject, color: '#1688ff' },
        ]}
      />

      <ExecutionPrefillBanner />

      <OwnerCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">AI Creative Studio</h2>
            <p className="text-sm text-slate-500">Visual advert concepts, client approval, revisions and campaign launch.</p>
          </div>
          <OpenCreativeStudioButton />
        </div>
      </OwnerCard>

      <MarketingMaterialStudio />

      <OwnerCard>
        <h2 className="text-xl font-black text-slate-950">AI Advert Image Studio</h2>
        <p className="mt-1 text-sm text-slate-500">
          Generates a professional image prompt for Facebook, Instagram, WhatsApp, LinkedIn or Google Display.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Product / Software Name
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={productName}
              onChange={e => setProductName(e.target.value)}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Target Audience
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={targetAudience}
              onChange={e => setTargetAudience(e.target.value)}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Platform
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={platform}
              onChange={e => setPlatform(e.target.value as AdvertPlatform)}
            >
              {PLATFORMS.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Style
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={style}
              onChange={e => setStyle(e.target.value as AdvertStyle)}
            >
              {STYLES.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Offer / Message
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={offerMessage}
              onChange={e => setOfferMessage(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={generateAdvert}
          className="mt-5 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white"
        >
          Generate Advert Prompt
        </button>

        <div className="mt-6 space-y-3">
          {advertConcepts.length === 0 ? (
            <OwnerEmptyState
              title="No advert concepts yet"
              description="Generate your first AI image prompt for VYRON CORE or a client campaign."
            />
          ) : (
            advertConcepts.map(c => (
              <div key={c.id} className="rounded-2xl border border-slate-100 p-2">
                <ClickableRow
                  title={`${c.platform} — ${c.productName}`}
                  subtitle={`${c.style} · ${c.targetAudience.slice(0, 60)}…`}
                  badge={c.platform}
                  accent="#ec4899"
                  onClick={() =>
                    openDrill(
                      buildOwnerDrill(
                        c.productName,
                        c.offerMessage,
                        'Content Engine',
                        [
                          { label: 'Platform', value: c.platform },
                          { label: 'Style', value: c.style },
                        ],
                        ['Use prompt in image generator', c.prompt, 'Save exported creative to client folder'],
                        undefined,
                        {
                          department: 'Content Engine',
                          kind: 'advert_image',
                          outputNeeded: 'Exported advert image file approved for paid social',
                          advertMeta: {
                            prompt: c.prompt,
                            platform: c.platform,
                            audience: c.targetAudience,
                            style: c.style,
                            productName: c.productName,
                          },
                        },
                      ),
                    )
                  }
                />
                <div className="px-3 pb-2">
                  <button
                    type="button"
                    onClick={() => deleteAdvertConcept(c.id)}
                    className="text-[10px] font-black uppercase text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </OwnerCard>

      <OwnerCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black text-slate-950">Publishing Queue</h2>
          <button
            type="button"
            onClick={() => setShowContentForm(v => !v)}
            className="rounded-2xl bg-violet-600 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white"
          >
            {showContentForm ? 'Cancel' : 'Add Content Task'}
          </button>
        </div>

        {showContentForm ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Title
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={contentTitle}
                onChange={e => setContentTitle(e.target.value)}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Type
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={contentType}
                onChange={e => setContentType(e.target.value as VyronContentTask['type'])}
              >
                {(['Blog', 'Landing Page', 'FAQ', 'Schema'] as const).map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Target Keyword
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                list="vyron-keywords"
                value={contentKeyword}
                onChange={e => setContentKeyword(e.target.value)}
              />
              <datalist id="vyron-keywords">
                {keywords.map(k => (
                  <option key={k.id} value={k.keyword} />
                ))}
              </datalist>
            </label>
            <button
              type="button"
              onClick={() => {
                if (!contentTitle.trim()) return
                addContentTask({
                  title: contentTitle.trim(),
                  type: contentType,
                  status: 'Draft',
                  targetKeyword: contentKeyword.trim() || settings.defaultProject,
                })
                setContentTitle('')
                setShowContentForm(false)
              }}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white sm:col-span-2"
            >
              Save to Queue
            </button>
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          {contentTasks.length === 0 ? (
            <OwnerEmptyState
              title="No content in queue yet"
              description="Add content tasks as you build SEO landing pages, blogs and FAQs for clients."
              action={
                <button
                  type="button"
                  onClick={() => setShowContentForm(true)}
                  className="rounded-2xl bg-violet-600 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white"
                >
                  Add First Content Task
                </button>
              }
            />
          ) : (
            contentTasks.map(item => (
              <ClickableRow
                key={item.id}
                title={item.title}
                subtitle={`${item.type} · ${item.targetKeyword} · ${item.status}`}
                badge={item.status}
                accent="#d946ef"
                onClick={() =>
                  openDrill(
                    buildOwnerDrill(
                      item.title,
                      `Optimize for "${item.targetKeyword}"`,
                      'Content Engine',
                      [
                        { label: 'Type', value: item.type },
                        { label: 'Status', value: item.status },
                        { label: 'Target Keyword', value: item.targetKeyword },
                      ],
                      [
                        'Outline H1/H2 around target keyword',
                        'Add internal links and FAQ schema',
                        'Schedule publish and track rankings',
                      ],
                      undefined,
                      { department: 'Content Engine', priority: 'High' },
                    ),
                  )
                }
              />
            ))
          )}
        </div>
      </OwnerCard>
    </OwnerPageShell>
  )
}

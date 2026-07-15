'use client'

import { useEffect, useState } from 'react'
import { useAppNavigation } from '@/context/AppNavigationContext'
import { useVyronData } from '@/context/VyronDataContext'
import { CopyBlock } from '@/components/owner/CopyBlock'
import { generateMarketingMaterialPack } from '@/lib/marketingMaterialGenerator'
import type { MarketingStudioPrefill } from '@/lib/executionPrefill'
import { OwnerCard, OwnerEmptyState } from '@/components/owner/OwnerPageShell'

const PLATFORMS = ['Facebook', 'Instagram', 'WhatsApp', 'LinkedIn', 'Google Search', 'All Channels']
const TONES = ['Premium SaaS', 'Bold Social', 'Corporate', 'Friendly', 'Direct Response']

export function MarketingMaterialStudio() {
  const { executionPrefill } = useAppNavigation()
  const { store, saveMarketingMaterial, deleteMarketingMaterial, queueActionFromMaterial } = useVyronData()
  const { settings, marketingMaterials } = store

  const [form, setForm] = useState<MarketingStudioPrefill>({
    productName: settings.defaultProject,
    targetAudience: 'South African business owners and operations managers',
    platform: 'Facebook',
    offerMessage: 'Stop losing payroll hours — one workforce command centre',
    tone: 'Premium SaaS',
    campaignGoal: 'Lead generation',
    targetArea: settings.defaultTargetArea,
  })
  const [pack, setPack] = useState<ReturnType<typeof generateMarketingMaterialPack> | null>(null)

  useEffect(() => {
    if (executionPrefill?.marketingStudio) {
      setForm({ ...executionPrefill.marketingStudio })
    }
  }, [executionPrefill])

  const generate = () => setPack(generateMarketingMaterialPack(form))

  const savePack = () => {
    const p = pack ?? generateMarketingMaterialPack(form)
    saveMarketingMaterial({
      title: `${form.productName} — ${form.platform} pack`,
      platform: form.platform,
      materialType: 'pack',
      content: p.fullDocument,
      productName: form.productName,
      targetArea: form.targetArea,
      actionId: executionPrefill?.actionId,
    })
  }

  const savePrompt = () => {
    const p = pack ?? generateMarketingMaterialPack(form)
    saveMarketingMaterial({
      title: `${form.productName} — Image Prompt`,
      platform: form.platform,
      materialType: 'advert_image_prompt',
      content: p.advertImagePrompt,
      productName: form.productName,
      targetArea: form.targetArea,
    })
  }

  return (
    <>
      <OwnerCard>
        <h2 className="text-xl font-black text-slate-950">AI Marketing Material Studio</h2>
        <p className="mt-1 text-sm text-slate-500">
          Facebook, Instagram, WhatsApp, LinkedIn, Google ads, image prompts, landing sections, blog & FAQ.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <L label="Software / Product" value={form.productName} set={v => setForm(f => ({ ...f, productName: v }))} />
          <L label="Target Audience" value={form.targetAudience} set={v => setForm(f => ({ ...f, targetAudience: v }))} />
          <L label="Platform" value={form.platform} select={PLATFORMS} set={v => setForm(f => ({ ...f, platform: v }))} />
          <L label="Tone" value={form.tone} select={TONES} set={v => setForm(f => ({ ...f, tone: v }))} />
          <L label="Campaign Goal" value={form.campaignGoal} set={v => setForm(f => ({ ...f, campaignGoal: v }))} />
          <L label="Target Area" value={form.targetArea} set={v => setForm(f => ({ ...f, targetArea: v }))} />
          <L
            label="Offer / Message"
            value={form.offerMessage}
            set={v => setForm(f => ({ ...f, offerMessage: v }))}
            span
          />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={generate}
            className="rounded-2xl bg-violet-600 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white"
          >
            Generate Marketing Materials
          </button>
          <button
            type="button"
            onClick={savePack}
            className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 text-[10px] font-black uppercase text-violet-800"
          >
            Save to Library
          </button>
          <button
            type="button"
            onClick={savePrompt}
            className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 px-5 py-3 text-[10px] font-black uppercase text-fuchsia-800"
          >
            Save Image Prompt Only
          </button>
        </div>

        {pack ? (
          <div className="mt-6 space-y-3">
            <CopyBlock label="Full Pack" text={pack.fullDocument} />
            <CopyBlock label="Facebook Ad" text={pack.facebookAd} />
            <CopyBlock label="Instagram Post" text={pack.instagramPost} />
            <CopyBlock label="WhatsApp Status" text={pack.whatsappStatus} />
            <CopyBlock label="LinkedIn Post" text={pack.linkedinPost} />
            <CopyBlock label="Google Headlines" text={pack.googleHeadlines} />
            <CopyBlock label="Google Descriptions" text={pack.googleDescriptions} />
            <CopyBlock label="Advert Image Prompt" text={pack.advertImagePrompt} />
            <CopyBlock label="Landing Section" text={pack.landingSection} />
            <CopyBlock label="Blog Outline" text={pack.blogOutline} />
            <CopyBlock label="FAQ Block" text={pack.faqBlock} />
          </div>
        ) : null}
      </OwnerCard>

      <OwnerCard>
        <h2 className="text-lg font-black text-slate-950">Saved Marketing Materials</h2>
        <div className="mt-5 space-y-3">
          {marketingMaterials.length === 0 ? (
            <OwnerEmptyState title="No saved materials" description="Generate and save a pack above." />
          ) : (
            marketingMaterials.map(m => (
              <div key={m.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="text-sm font-black text-slate-900">{m.title}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {m.platform} · {m.materialType} · {new Date(m.createdAt).toLocaleDateString('en-ZA')}
                </div>
                <pre className="mt-3 max-h-24 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  {m.content.slice(0, 400)}
                  {m.content.length > 400 ? '…' : ''}
                </pre>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(m.content)}
                    className="text-[10px] font-black uppercase text-violet-600"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => queueActionFromMaterial(m.id)}
                    className="text-[10px] font-black uppercase text-emerald-600"
                  >
                    Add to Action Queue
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMarketingMaterial(m.id)}
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
    </>
  )
}

function L({
  label,
  value,
  set,
  select,
  span,
}: {
  label: string
  value: string
  set: (v: string) => void
  select?: string[]
  span?: boolean
}) {
  return (
    <label className={`text-sm font-semibold text-slate-700 ${span ? 'sm:col-span-2' : ''}`}>
      {label}
      {select ? (
        <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={value} onChange={e => set(e.target.value)}>
          {select.map(o => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={value} onChange={e => set(e.target.value)} />
      )}
    </label>
  )
}

'use client'

import { useState, type ReactNode } from 'react'
import { ActionExecutionButtons } from '@/components/owner/ActionExecutionButtons'
import { useAppNavigation } from '@/context/AppNavigationContext'
import { useVyronData } from '@/context/VyronDataContext'
import { prefillFromAction } from '@/lib/executionPrefill'
import { formatActionDate, isActiveStatus, statusLabel } from '@/lib/actionQueue'
import type { VyronActionQueueItem } from '@/lib/vyronStore/types'
import { OwnerCard, OwnerEmptyState, OwnerPageShell, OwnerStatGrid } from '@/components/owner/OwnerPageShell'

function ActionBtn({
  children,
  onClick,
  variant = 'default',
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  variant?: 'default' | 'primary' | 'danger'
  disabled?: boolean
}) {
  const cls =
    variant === 'primary'
      ? 'bg-emerald-600 text-white'
      : variant === 'danger'
        ? 'border border-slate-200 text-slate-600'
        : 'border border-violet-200 bg-violet-50 text-violet-800'
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-50 ${cls}`}
    >
      {children}
    </button>
  )
}

export function AIActionQueuePage() {
  const {
    store,
    startAction,
    generateActionOutput,
    appendSeoPlan,
    appendAdsTestPlan,
    appendContentBrief,
    updateActionNotes,
    completeAction,
    deleteAction,
    markImageCreated,
    createFollowUpContentTask,
    createFollowUpGoogleAdsTask,
    createFollowUpSeoTask,
    createFollowUpReportTask,
    saveMarketingMaterial,
  } = useVyronData()
  const { navigateWithPrefill } = useAppNavigation()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [copyLabel, setCopyLabel] = useState('')

  const queue = store.actionQueue
  const active = queue.filter(a => isActiveStatus(a.status))
  const completed = queue.filter(a => a.status === 'completed')
  const pendingCount = queue.filter(a => a.status === 'pending').length
  const inProgressCount = queue.filter(
    a => a.status === 'in_progress' || a.status === 'ready_to_execute',
  ).length
  const criticalCount = queue.filter(a => a.priority === 'Critical' && a.status !== 'completed').length

  const selected = queue.find(a => a.id === selectedId) ?? null

  const flashCopy = (label: string, text: string) => {
    void navigator.clipboard.writeText(text)
    setCopyLabel(label)
    setTimeout(() => setCopyLabel(''), 2000)
  }

  const copyOutput = (action: VyronActionQueueItem) => {
    const text =
      action.generatedOutput ||
      (action.kind === 'advert_image' && action.advertMeta?.prompt) ||
      action.executionBrief
    flashCopy('output', text)
  }

  const isSeoOrAds = (a: VyronActionQueueItem) =>
    a.kind === 'seo' || a.kind === 'google_ads' || a.sourcePage.toLowerCase().includes('seo') || a.sourcePage.toLowerCase().includes('ads')

  return (
    <OwnerPageShell
      eyebrow="Execution Queue · Do This Next"
      title="AI Action Queue"
      subtitle="Start a task, generate output, copy instructions, execute, then mark complete."
      theme="queue"
    >
      <OwnerStatGrid
        stats={[
          { label: 'Pending', value: String(pendingCount), color: '#f97316' },
          { label: 'In Progress', value: String(inProgressCount), color: '#1688ff' },
          { label: 'Critical', value: String(criticalCount), color: '#ef4444' },
          { label: 'Completed', value: String(completed.length), color: '#10b981' },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-12">
        <OwnerCard className="xl:col-span-5">
          <h2 className="text-xl font-black text-slate-950">Actions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Your marketing execution centre — every task from drilldowns lands here.
          </p>
          <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto">
            {active.length === 0 && completed.length === 0 ? (
              <OwnerEmptyState
                title="No actions in queue"
                description="Open any module drilldown and click “Add to AI Action Queue”."
              />
            ) : null}
            {active.map(action => (
              <button
                key={action.id}
                type="button"
                onClick={() => setSelectedId(action.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selectedId === action.id ? 'border-violet-300 bg-violet-50/60' : 'border-slate-100 bg-white hover:border-violet-200'
                }`}
              >
                <div className="text-sm font-black text-slate-900">{action.title}</div>
                <div className="mt-1 text-xs font-semibold text-slate-500">
                  {action.sourcePage} · {action.priority}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-black uppercase text-violet-700">
                    {statusLabel(action.status)}
                  </span>
                  {action.generatedOutput ? (
                    <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-black uppercase text-cyan-700">
                      Output ready
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
            {completed.length > 0 ? (
              <p className="pt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Completed</p>
            ) : null}
            {completed.map(action => (
              <button
                key={action.id}
                type="button"
                onClick={() => setSelectedId(action.id)}
                className={`w-full rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-left ${
                  selectedId === action.id ? 'ring-2 ring-violet-200' : ''
                }`}
              >
                <div className="text-sm font-semibold text-slate-500 line-through">{action.title}</div>
              </button>
            ))}
          </div>
        </OwnerCard>

        <OwnerCard className="xl:col-span-7">
          {!selected ? (
            <OwnerEmptyState
              title="Select an action to view details"
              description="Choose a task on the left. Then Start → Generate Output → copy instructions → Mark Complete. Use follow-up buttons to spawn content, ads, SEO or report tasks."
            />
          ) : (
            <ActionDetailPanel
              action={selected}
              copyLabel={copyLabel}
              onStart={() => startAction(selected.id)}
              onGenerate={() => generateActionOutput(selected.id)}
              onCopyOutput={() => copyOutput(selected)}
              onComplete={() => completeAction(selected.id)}
              onDelete={() => {
                deleteAction(selected.id)
                setSelectedId(null)
              }}
              onSeoPlan={() => appendSeoPlan(selected.id)}
              onAdsPlan={() => appendAdsTestPlan(selected.id)}
              onContentBrief={() => appendContentBrief(selected.id)}
              onNotes={notes => updateActionNotes(selected.id, notes)}
              onMarkImage={() => markImageCreated(selected.id)}
              onCopyPrompt={() =>
                selected.advertMeta?.prompt && flashCopy('prompt', selected.advertMeta.prompt)
              }
              onFollowContent={() => createFollowUpContentTask(selected.id)}
              onFollowAds={() => createFollowUpGoogleAdsTask(selected.id)}
              onFollowSeo={() => createFollowUpSeoTask(selected.id)}
              onFollowReport={() => createFollowUpReportTask(selected.id)}
              showSeoTools={isSeoOrAds(selected)}
              onSaveToMaterials={() => {
                const text =
                  selected.generatedOutput ||
                  selected.advertMeta?.prompt ||
                  selected.executionBrief
                saveMarketingMaterial({
                  title: selected.title,
                  platform: selected.advertMeta?.platform ?? selected.sourcePage,
                  materialType: selected.advertMeta ? 'advert_image_prompt' : 'pack',
                  content: text,
                  productName: selected.advertMeta?.productName ?? selected.title,
                  targetArea: selected.contextMeta?.targetArea ?? store.settings.defaultTargetArea,
                  actionId: selected.id,
                })
              }}
              onOpenCreativeStudio={() =>
                navigateWithPrefill('ai-creative-studio', prefillFromAction(selected, store.settings))
              }
            />
          )}
        </OwnerCard>
      </div>
    </OwnerPageShell>
  )
}

function ActionDetailPanel({
  action,
  copyLabel,
  onStart,
  onGenerate,
  onCopyOutput,
  onComplete,
  onDelete,
  onSeoPlan,
  onAdsPlan,
  onContentBrief,
  onNotes,
  onMarkImage,
  onCopyPrompt,
  onFollowContent,
  onFollowAds,
  onFollowSeo,
  onFollowReport,
  showSeoTools,
  onSaveToMaterials,
  onOpenCreativeStudio,
}: {
  action: VyronActionQueueItem
  copyLabel: string
  onStart: () => void
  onGenerate: () => void
  onCopyOutput: () => void
  onComplete: () => void
  onDelete: () => void
  onSeoPlan: () => void
  onAdsPlan: () => void
  onContentBrief: () => void
  onNotes: (notes: string) => void
  onMarkImage: () => void
  onCopyPrompt: () => void
  onFollowContent: () => void
  onFollowAds: () => void
  onFollowSeo: () => void
  onFollowReport: () => void
  showSeoTools: boolean
  onSaveToMaterials: () => void
  onOpenCreativeStudio: () => void
}) {
  const ctx = action.contextMeta
  const isAdvert = action.kind === 'advert_image' && action.advertMeta
  const canCopy = Boolean(action.generatedOutput || (isAdvert && action.advertMeta?.prompt))

  return (
    <div>
      <h2 className="text-xl font-black text-slate-950">Action Detail</h2>
      <p className="mt-1 text-sm font-semibold text-slate-600">{action.title}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <ActionBtn variant="primary" onClick={onStart} disabled={action.status === 'completed'}>
          Start Action
        </ActionBtn>
        <ActionBtn onClick={onGenerate} disabled={action.status === 'completed'}>
          Generate Output
        </ActionBtn>
        <ActionBtn onClick={onCopyOutput} disabled={!canCopy}>
          {copyLabel === 'output' ? 'Copied ✓' : 'Copy Output'}
        </ActionBtn>
        {isAdvert ? (
          <ActionBtn onClick={onCopyPrompt}>
            {copyLabel === 'prompt' ? 'Copied ✓' : 'Copy Prompt'}
          </ActionBtn>
        ) : null}
        <ActionBtn
          variant="primary"
          onClick={onComplete}
          disabled={action.status === 'completed'}
        >
          Mark Complete
        </ActionBtn>
        <ActionBtn variant="danger" onClick={onDelete}>
          Delete
        </ActionBtn>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <DetailRow label="Source Page" value={action.sourcePage} />
        <DetailRow label="Priority" value={action.priority} />
        <DetailRow label="Status" value={statusLabel(action.status)} />
        <DetailRow label="Date Added" value={formatActionDate(action.createdAt)} />
        {action.completedAt ? <DetailRow label="Completed" value={formatActionDate(action.completedAt)} /> : null}
        <DetailRow label="Due" value={action.due} />
        <DetailRow label="Type" value={action.kind.replace('_', ' ')} />
      </div>

      {(showSeoTools || action.kind === 'seo' || action.kind === 'google_ads') && ctx ? (
        <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4">
          <h3 className="text-sm font-black text-cyan-900">SEO / Search Context</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <DetailRow label="Keyword" value={ctx.keyword ?? action.title} />
            <DetailRow label="Business" value={ctx.business ?? '—'} />
            <DetailRow label="Target Area" value={ctx.targetArea ?? '—'} />
            <DetailRow label="Search Intent" value={ctx.searchIntent ?? '—'} />
            <DetailRow label="Difficulty" value={ctx.difficulty ?? '—'} />
            <DetailRow label="Volume" value={ctx.volume ?? '—'} />
            <DetailRow label="Test Budget" value={ctx.suggestedDailyBudget ?? '—'} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <ActionBtn onClick={onSeoPlan}>Generate SEO Plan</ActionBtn>
            <ActionBtn onClick={onAdsPlan}>Generate Google Ads Test Plan</ActionBtn>
            <ActionBtn onClick={onContentBrief}>Generate Content Brief</ActionBtn>
          </div>
        </div>
      ) : null}

      {isAdvert && action.advertMeta ? (
        <div className="mt-5 rounded-2xl border border-fuchsia-100 bg-fuchsia-50/50 p-4">
          <h3 className="text-sm font-black text-fuchsia-900">Advert Image Task</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <DetailRow label="Product" value={action.advertMeta.productName} />
            <DetailRow label="Platform" value={action.advertMeta.platform} />
            <DetailRow label="Audience" value={action.advertMeta.audience} />
            <DetailRow label="Style" value={action.advertMeta.style} />
            {action.advertMeta.offerMessage ? (
              <DetailRow label="Offer" value={action.advertMeta.offerMessage} />
            ) : null}
          </div>
          <pre className="mt-4 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-3 text-xs text-slate-700">
            {action.advertMeta.prompt}
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionBtn variant="primary" onClick={onOpenCreativeStudio}>
              Open Creative Studio
            </ActionBtn>
            <ActionBtn onClick={onCopyPrompt}>Copy Image Prompt</ActionBtn>
            <ActionBtn onClick={onSaveToMaterials}>Save to Marketing Materials</ActionBtn>
            <ActionBtn onClick={onMarkImage}>Mark Creative Created</ActionBtn>
          </div>
        </div>
      ) : null}

      <ActionExecutionButtons
        action={action}
        onGenerateOutput={onGenerate}
        onCopyOutput={onCopyOutput}
        copyLabel={copyLabel}
      />

      <div className="mt-5">
        <h3 className="text-sm font-black text-slate-800">Execution Brief</h3>
        <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">{action.executionBrief}</p>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-black text-slate-800">Next Steps</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm font-semibold text-slate-700">
          {action.nextSteps.map((step, i) => (
            <li key={`${step}-${i}`}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-black text-slate-800">Output Needed</h3>
        <p className="mt-1 text-sm font-semibold text-slate-600">{action.outputNeeded}</p>
      </div>

      {action.generatedOutput ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-black text-emerald-900">
              Generated Output — {statusLabel(action.status)}
            </h3>
            <ActionBtn onClick={onCopyOutput}>Copy Output</ActionBtn>
          </div>
          <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-4 text-xs font-medium leading-6 text-slate-700">
            {action.generatedOutput}
          </pre>
          {action.status === 'ready_to_execute' ? (
            <p className="mt-3 text-xs font-bold text-emerald-700">
              Ready to execute — copy output, complete the steps, then Mark Complete.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
          Click <strong>Generate Output</strong> to get AI-style marketing instructions for this task.
        </p>
      )}

      <div className="mt-5">
        <label className="text-sm font-black text-slate-800">
          Notes
          <textarea
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
            rows={3}
            value={action.notes ?? ''}
            onChange={e => onNotes(e.target.value)}
            placeholder="Log outcomes, blockers, client feedback…"
          />
        </label>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <h3 className="text-sm font-black text-slate-800">Create Follow-up Task</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <ActionBtn onClick={onFollowContent}>Content Task</ActionBtn>
          <ActionBtn onClick={onFollowAds}>Google Ads Task</ActionBtn>
          <ActionBtn onClick={onFollowSeo}>SEO Update Task</ActionBtn>
          <ActionBtn onClick={onFollowReport}>Report Task</ActionBtn>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-0.5 text-sm font-black text-slate-900">{value}</div>
    </div>
  )
}

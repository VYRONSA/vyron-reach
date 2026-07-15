'use client'

import { useEffect, useState } from 'react'
import { useAppNavigation } from '@/context/AppNavigationContext'
import { useVyronData } from '@/context/VyronDataContext'
import { ChatGptHandoffWorkspace } from '@/components/owner/ChatGptHandoffWorkspace'
import { OwnerPageShell } from '@/components/owner/OwnerPageShell'
import { getPlatform, type PlatformId } from '@/lib/platforms'

export function AIMarketingDirectorPage() {
  const { executionPrefill, clearExecutionPrefill } = useAppNavigation()
  const { store } = useVyronData()

  const [toast, setToast] = useState('')
  const [platformId, setPlatformId] = useState<PlatformId | null>(null)

  const flash = (t: string) => {
    setToast(t)
    setTimeout(() => setToast(''), 2500)
  }

  useEffect(() => {
    if (!executionPrefill) return
    if (executionPrefill.directorPlatform) {
      setPlatformId(executionPrefill.directorPlatform as PlatformId)
    }
    clearExecutionPrefill()
  }, [executionPrefill, clearExecutionPrefill])

  return (
    <OwnerPageShell
      eyebrow="AI Marketing Operating System"
      title={platformId ? `${getPlatform(platformId).label} — ChatGPT Handoff` : 'Campaign Studio'}
      subtitle="Prepare world-class prompts → Open in ChatGPT → Import creative → Approve & launch in VYRON REACH."
      theme="automation"
    >
      {toast ? (
        <div className="mb-4 rounded-full bg-emerald-100 px-4 py-2 text-center text-xs font-black text-emerald-800">
          {toast}
        </div>
      ) : null}

      {platformId ? (
        <div
          className={`mb-5 overflow-hidden rounded-[24px] bg-gradient-to-r ${getPlatform(platformId).gradient} p-5 text-white shadow-lg`}
        >
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-xl font-black">
              {getPlatform(platformId).icon}
            </span>
            <div>
              <p className="text-lg font-black">{getPlatform(platformId).label}</p>
              <p className="text-sm font-semibold text-white/90">
                Strategist-grade prompt built here · Creative generation in ChatGPT
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <ChatGptHandoffWorkspace
        initialPlatform={platformId}
        initialClientId={store.clients[0]?.id ?? null}
        onToast={flash}
      />
    </OwnerPageShell>
  )
}

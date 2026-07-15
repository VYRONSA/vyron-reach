'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { createDefaultStore } from '@/lib/vyronStore/defaults'
import {
  applyDemoEnvironment,
  clearVyronReachData,
  getLocalStoreUpdatedAt,
  loadStore,
  newId,
  saveStore,
  setLocalStoreUpdatedAt,
} from '@/lib/vyronStore/storage'
import {
  fetchOwnerStoreFromSupabase,
  getSupabaseUserId,
  migrateBlobToNormalized,
  pushOwnerStoreToSupabase,
} from '@/lib/vyronStore/supabaseSync'
import type { AddActionQueueInput } from '@/lib/actionQueue'
import { normalizeActionItem, statusLabel } from '@/lib/actionQueue'
import {
  generateAdsTestPlanAppend,
  generateContentBriefAppend,
  generateExecutionOutput,
  generateSeoPlanAppend,
} from '@/lib/actionOutputGenerator'
import { buildRevisionCreative, generateCreativeVariations } from '@/lib/creativeGenerator'
import { buildCreativeFromDirectorAI } from '@/lib/marketingDirector/saveCreative'
import { prefillFromCreative } from '@/lib/executionPrefill'
import type {
  Priority,
  VyronActionQueueItem,
  VyronAdvertConcept,
  VyronCampaign,
  VyronClient,
  VyronGoogleAdsPlan,
  VyronMarketingMaterial,
  VyronCreative,
  CreativeBuilderInput,
  CreativePlatform,
  CreativeRevisionNotes,
  CreativeStatus,
  UploadedCreativeStatus,
  VyronUploadedCreative,
  VyronCompetitor,
  VyronContentTask,
  VyronKeyword,
  VyronRanking,
  VyronSettings,
  VyronStore,
} from '@/lib/vyronStore/types'

function rankingForKeyword(kw: VyronKeyword): VyronRanking {
  return {
    id: newId('rank'),
    keyword: kw.keyword,
    page: kw.recommendedPage || 'Landing page (pending)',
    position: 50,
    change: 0,
    forecast: kw.forecast,
    stuck: true,
  }
}

function upsertRankingsForKeywords(prev: VyronStore, added: VyronKeyword[]): VyronRanking[] {
  const existing = new Set(prev.rankings.map(r => r.keyword.toLowerCase()))
  const rows = added
    .filter(k => !existing.has(k.keyword.toLowerCase()))
    .map(rankingForKeyword)
  return rows.length ? [...rows, ...prev.rankings] : prev.rankings
}

export type SyncMode = 'local-only' | 'syncing' | 'synced' | 'error'
export type SyncStorage = 'local' | 'normalized' | 'blob'

type VyronDataContextValue = {
  store: VyronStore
  hydrated: boolean
  syncMode: SyncMode
  syncStorage: SyncStorage
  syncError: string | null
  cloudEnabled: boolean
  lastSyncedAt: string | null
  syncNow: () => Promise<void>
  updateSettings: (patch: Partial<VyronSettings>) => void
  addClient: (client: Omit<VyronClient, 'id' | 'createdAt'>) => VyronClient
  updateClient: (id: string, patch: Partial<VyronClient>) => void
  deleteClient: (id: string) => void
  addKeyword: (keyword: Omit<VyronKeyword, 'id'>) => VyronKeyword
  addKeywords: (keywords: Omit<VyronKeyword, 'id'>[]) => void
  deleteKeyword: (id: string) => void
  addAdvertConcept: (concept: Omit<VyronAdvertConcept, 'id' | 'createdAt'>) => VyronAdvertConcept
  deleteAdvertConcept: (id: string) => void
  addCompetitor: (competitor: Omit<VyronCompetitor, 'id'>) => VyronCompetitor
  deleteCompetitor: (id: string) => void
  addCampaign: (campaign: Omit<VyronCampaign, 'id'>) => VyronCampaign
  deleteCampaign: (id: string) => void
  saveGoogleAdsPlan: (plan: Omit<VyronGoogleAdsPlan, 'id' | 'createdAt' | 'launched'>) => VyronGoogleAdsPlan
  deleteGoogleAdsPlan: (id: string) => void
  markGoogleAdsPlanLaunched: (id: string) => void
  saveMarketingMaterial: (
    material: Omit<VyronMarketingMaterial, 'id' | 'createdAt'>,
  ) => VyronMarketingMaterial
  deleteMarketingMaterial: (id: string) => void
  queueActionFromMaterial: (materialId: string) => void
  generateCreativeVariations: (input: CreativeBuilderInput, opts?: { facebookPack?: boolean }) => VyronCreative[]
  saveDirectorCreativeFromAI: (input: {
    clientId?: string
    clientName: string
    platform: CreativePlatform
    campaignGoal: string
    aiContent: string
  }) => VyronCreative
  addUploadedCreative: (
    input: Omit<VyronUploadedCreative, 'id' | 'createdAt' | 'updatedAt'>,
  ) => VyronUploadedCreative
  updateUploadedCreative: (id: string, patch: Partial<VyronUploadedCreative>) => void
  approveUploadedCreative: (id: string) => void
  rejectUploadedCreative: (id: string, note?: string) => void
  requestUploadedCreativeRevision: (
    id: string,
    notes: CreativeRevisionNotes,
    revisionPrompt: string,
  ) => void
  setFinalUploadedCreative: (id: string) => void
  deleteUploadedCreative: (id: string) => void
  updateCreativeStatus: (id: string, status: CreativeStatus, note?: string) => void
  requestCreativeRevision: (id: string, feedback: string) => VyronCreative | null
  duplicateCreative: (id: string) => VyronCreative | null
  updateCreativeFeedback: (id: string, feedback: string) => void
  deleteCreative: (id: string) => void
  getCreativeLaunchPrefill: (id: string) => import('@/lib/executionPrefill').ExecutionPrefill | null
  pendingActionCount: number
  addToActionQueue: (item: AddActionQueueInput) => VyronActionQueueItem
  startAction: (id: string) => void
  generateActionOutput: (id: string) => void
  appendSeoPlan: (id: string) => void
  appendAdsTestPlan: (id: string) => void
  appendContentBrief: (id: string) => void
  updateActionNotes: (id: string, notes: string) => void
  completeAction: (id: string) => void
  markImageCreated: (id: string) => void
  createFollowUpContentTask: (actionId: string) => void
  createFollowUpGoogleAdsTask: (actionId: string) => void
  createFollowUpSeoTask: (actionId: string) => void
  createFollowUpReportTask: (actionId: string) => void
  deleteAction: (id: string) => void
  addContentTask: (task: Omit<VyronContentTask, 'id'>) => void
  updateContentStatus: (id: string, status: VyronContentTask['status']) => void
  generateMonthlyReport: (title?: string) => string
  saveCustomReport: (title: string, body: string, type?: string) => void
  refresh: () => void
  resetAllData: () => void
  loadDemoEnvironment: () => void
}

const VyronDataContext = createContext<VyronDataContextValue | null>(null)

const SYNC_DEBOUNCE_MS = 700

export function VyronDataProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<VyronStore>(createDefaultStore)
  const [hydrated, setHydrated] = useState(false)
  const [syncMode, setSyncMode] = useState<SyncMode>('local-only')
  const [syncStorage, setSyncStorage] = useState<SyncStorage>('local')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)

  const userIdRef = useRef<string | null>(null)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const storeRef = useRef(store)
  storeRef.current = store

  const cloudEnabled = isSupabaseConfigured

  const pushToCloud = useCallback(async (payload: VyronStore, userId: string) => {
    setSyncMode('syncing')
    setSyncError(null)
    const { error, updatedAt } = await pushOwnerStoreToSupabase(userId, payload)
    if (error) {
      setSyncMode('error')
      setSyncError(error)
      return
    }
    if (updatedAt) {
      setLocalStoreUpdatedAt(updatedAt)
      setLastSyncedAt(updatedAt)
    }
    setSyncStorage('normalized')
    setSyncMode('synced')
  }, [])

  const scheduleCloudSave = useCallback(
    (payload: VyronStore) => {
      const userId = userIdRef.current
      if (!userId || !cloudEnabled) return
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
      syncTimerRef.current = setTimeout(() => {
        void pushToCloud(payload, userId)
      }, SYNC_DEBOUNCE_MS)
    },
    [cloudEnabled, pushToCloud],
  )

  const bootstrap = useCallback(async () => {
    const local = loadStore()
    const userId = await getSupabaseUserId()
    userIdRef.current = userId

    if (!userId || !cloudEnabled) {
      setStore(local)
      setSyncMode('local-only')
      setSyncStorage('local')
      setHydrated(true)
      return
    }

    const remote = await fetchOwnerStoreFromSupabase(userId)

    if (remote.error) {
      setStore(local)
      setSyncMode('error')
      setSyncStorage('local')
      setSyncError(remote.error)
      setHydrated(true)
      return
    }

    if (remote.store) {
      const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0
      const localTime = getLocalStoreUpdatedAt()

      if (remoteTime >= localTime) {
        setStore(remote.store)
        saveStore(remote.store)
        if (remote.updatedAt) {
          setLocalStoreUpdatedAt(remote.updatedAt)
          setLastSyncedAt(remote.updatedAt)
        }
        if (remote.source === 'blob') {
          setSyncStorage('blob')
          await migrateBlobToNormalized(userId, remote.store)
        } else {
          setSyncStorage('normalized')
        }
      } else {
        setStore(local)
        await pushToCloud(local, userId)
        setSyncStorage('normalized')
      }
      setSyncMode('synced')
    } else {
      setStore(local)
      await pushToCloud(local, userId)
      setSyncStorage('normalized')
      setSyncMode('synced')
    }

    setHydrated(true)
  }, [cloudEnabled, pushToCloud])

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  useEffect(() => {
    if (!cloudEnabled) return
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void bootstrap()
    })
    return () => subscription.unsubscribe()
  }, [bootstrap, cloudEnabled])

  useEffect(
    () => () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    },
    [],
  )

  const persist = useCallback(
    (updater: (prev: VyronStore) => VyronStore) => {
      setStore(prev => {
        const next = updater(prev)
        saveStore(next)
        scheduleCloudSave(next)
        return next
      })
    },
    [scheduleCloudSave],
  )

  const syncNow = useCallback(async () => {
    const userId = await getSupabaseUserId()
    userIdRef.current = userId
    if (!userId || !cloudEnabled) {
      setSyncMode('local-only')
      return
    }
    await pushToCloud(storeRef.current, userId)
  }, [cloudEnabled, pushToCloud])

  const updateSettings = useCallback(
    (patch: Partial<VyronSettings>) => {
      persist(prev => ({ ...prev, settings: { ...prev.settings, ...patch } }))
    },
    [persist],
  )

  const addClient = useCallback(
    (client: Omit<VyronClient, 'id' | 'createdAt'>) => {
      const row: VyronClient = {
        ...client,
        id: newId('client'),
        createdAt: new Date().toISOString(),
      }
      persist(prev => ({ ...prev, clients: [...prev.clients, row] }))
      return row
    },
    [persist],
  )

  const updateClient = useCallback(
    (id: string, patch: Partial<VyronClient>) => {
      persist(prev => ({
        ...prev,
        clients: prev.clients.map(c => (c.id === id ? { ...c, ...patch } : c)),
      }))
    },
    [persist],
  )

  const deleteClient = useCallback(
    (id: string) => {
      persist(prev => ({ ...prev, clients: prev.clients.filter(c => c.id !== id) }))
    },
    [persist],
  )

  const addKeyword = useCallback(
    (keyword: Omit<VyronKeyword, 'id'>) => {
      const row: VyronKeyword = { ...keyword, id: newId('kw') }
      persist(prev => ({
        ...prev,
        keywords: [row, ...prev.keywords],
        rankings: upsertRankingsForKeywords(prev, [row]),
      }))
      return row
    },
    [persist],
  )

  const addKeywords = useCallback(
    (keywords: Omit<VyronKeyword, 'id'>[]) => {
      const rows = keywords.map(k => ({ ...k, id: newId('kw') }))
      persist(prev => ({
        ...prev,
        keywords: [...rows, ...prev.keywords],
        rankings: upsertRankingsForKeywords(prev, rows),
      }))
    },
    [persist],
  )

  const deleteKeyword = useCallback(
    (id: string) => {
      persist(prev => {
        const removed = prev.keywords.find(k => k.id === id)
        const keywordText = removed?.keyword.toLowerCase()
        return {
          ...prev,
          keywords: prev.keywords.filter(k => k.id !== id),
          rankings: keywordText
            ? prev.rankings.filter(r => r.keyword.toLowerCase() !== keywordText)
            : prev.rankings,
        }
      })
    },
    [persist],
  )

  const addAdvertConcept = useCallback(
    (concept: Omit<VyronAdvertConcept, 'id' | 'createdAt'>) => {
      const row: VyronAdvertConcept = {
        ...concept,
        id: newId('advert'),
        createdAt: new Date().toISOString(),
      }
      persist(prev => ({ ...prev, advertConcepts: [row, ...prev.advertConcepts] }))
      return row
    },
    [persist],
  )

  const deleteAdvertConcept = useCallback(
    (id: string) => {
      persist(prev => ({
        ...prev,
        advertConcepts: prev.advertConcepts.filter(a => a.id !== id),
      }))
    },
    [persist],
  )

  const addCompetitor = useCallback(
    (competitor: Omit<VyronCompetitor, 'id'>) => {
      const row: VyronCompetitor = { ...competitor, id: newId('comp') }
      persist(prev => ({ ...prev, competitors: [row, ...prev.competitors] }))
      return row
    },
    [persist],
  )

  const deleteCompetitor = useCallback(
    (id: string) => {
      persist(prev => ({ ...prev, competitors: prev.competitors.filter(c => c.id !== id) }))
    },
    [persist],
  )

  const addCampaign = useCallback(
    (campaign: Omit<VyronCampaign, 'id'>) => {
      const row: VyronCampaign = { ...campaign, id: newId('camp') }
      persist(prev => ({ ...prev, campaigns: [row, ...prev.campaigns] }))
      return row
    },
    [persist],
  )

  const deleteCampaign = useCallback(
    (id: string) => {
      persist(prev => ({ ...prev, campaigns: prev.campaigns.filter(c => c.id !== id) }))
    },
    [persist],
  )

  const saveGoogleAdsPlan = useCallback(
    (plan: Omit<VyronGoogleAdsPlan, 'id' | 'createdAt' | 'launched'>) => {
      const row: VyronGoogleAdsPlan = {
        ...plan,
        id: newId('gplan'),
        launched: false,
        createdAt: new Date().toISOString(),
      }
      persist(prev => ({ ...prev, googleAdsPlans: [row, ...prev.googleAdsPlans] }))
      return row
    },
    [persist],
  )

  const deleteGoogleAdsPlan = useCallback(
    (id: string) => {
      persist(prev => ({ ...prev, googleAdsPlans: prev.googleAdsPlans.filter(p => p.id !== id) }))
    },
    [persist],
  )

  const markGoogleAdsPlanLaunched = useCallback(
    (id: string) => {
      persist(prev => ({
        ...prev,
        googleAdsPlans: prev.googleAdsPlans.map(p => (p.id === id ? { ...p, launched: true } : p)),
      }))
    },
    [persist],
  )

  const saveMarketingMaterial = useCallback(
    (material: Omit<VyronMarketingMaterial, 'id' | 'createdAt'>) => {
      const row: VyronMarketingMaterial = {
        ...material,
        id: newId('mat'),
        createdAt: new Date().toISOString(),
      }
      persist(prev => ({ ...prev, marketingMaterials: [row, ...prev.marketingMaterials] }))
      return row
    },
    [persist],
  )

  const deleteMarketingMaterial = useCallback(
    (id: string) => {
      persist(prev => ({
        ...prev,
        marketingMaterials: prev.marketingMaterials.filter(m => m.id !== id),
      }))
    },
    [persist],
  )

  const queueActionFromMaterial = useCallback(
    (materialId: string) => {
      persist(prev => {
        const mat = prev.marketingMaterials.find(m => m.id === materialId)
        if (!mat) return prev
        const row = normalizeActionItem(
          {
            id: newId('action'),
            title: `Execute: ${mat.title}`,
            subtitle: mat.platform,
            department: 'Content Engine',
            sourcePage: 'Content Engine',
            priority: 'High',
            due: 'This week',
            status: 'pending',
            createdAt: new Date().toISOString(),
            executionBrief: mat.content.slice(0, 500),
            nextSteps: ['Copy material', 'Deploy to channel', 'Track results', 'Mark complete'],
            outputNeeded: `Published ${mat.materialType} on ${mat.platform}`,
            kind: mat.materialType === 'advert_image_prompt' ? 'advert_image' : 'content',
            generatedOutput: mat.content,
          },
          prev.settings,
        )
        return { ...prev, actionQueue: [row, ...prev.actionQueue] }
      })
    },
    [persist],
  )

  const pushApproval = (
    creative: VyronCreative,
    status: CreativeStatus,
    note: string,
  ): VyronCreative => {
    const entry = {
      id: newId('hist'),
      status,
      note,
      createdAt: new Date().toISOString(),
    }
    return {
      ...creative,
      status,
      approvalHistory: [entry, ...creative.approvalHistory],
      updatedAt: new Date().toISOString(),
    }
  }

  const generateCreativeVariationsFn = useCallback(
    (input: CreativeBuilderInput, opts?: { facebookPack?: boolean }) => {
      const drafts = generateCreativeVariations(input, newId, opts)
      const now = new Date().toISOString()
      const rows: VyronCreative[] = drafts.map(d => ({ ...d, createdAt: now, updatedAt: now }))
      persist(prev => ({ ...prev, creatives: [...rows, ...prev.creatives] }))
      return rows
    },
    [persist],
  )

  const saveDirectorCreativeFromAIFn = useCallback(
    (input: {
      clientId?: string
      clientName: string
      platform: CreativePlatform
      campaignGoal: string
      aiContent: string
    }) => {
      const row = buildCreativeFromDirectorAI(input, newId)
      persist(prev => ({ ...prev, creatives: [row, ...prev.creatives] }))
      return row
    },
    [persist],
  )

  const addUploadedCreativeFn = useCallback(
    (input: Omit<VyronUploadedCreative, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString()
      const row: VyronUploadedCreative = {
        ...input,
        id: newId('upload'),
        createdAt: now,
        updatedAt: now,
      }
      persist(prev => ({ ...prev, uploadedCreatives: [row, ...prev.uploadedCreatives] }))
      return row
    },
    [persist],
  )

  const updateUploadedCreativeFn = useCallback(
    (id: string, patch: Partial<VyronUploadedCreative>) => {
      persist(prev => ({
        ...prev,
        uploadedCreatives: prev.uploadedCreatives.map(u =>
          u.id === id ? { ...u, ...patch, updatedAt: new Date().toISOString() } : u,
        ),
      }))
    },
    [persist],
  )

  const approveUploadedCreativeFn = useCallback(
    (id: string) => {
      updateUploadedCreativeFn(id, { status: 'Approved' })
    },
    [updateUploadedCreativeFn],
  )

  const rejectUploadedCreativeFn = useCallback(
    (id: string, note = 'Rejected') => {
      updateUploadedCreativeFn(id, { status: 'Rejected', revisionPrompt: note })
    },
    [updateUploadedCreativeFn],
  )

  const requestUploadedCreativeRevisionFn = useCallback(
    (id: string, notes: CreativeRevisionNotes, revisionPrompt: string) => {
      updateUploadedCreativeFn(id, {
        status: 'Needs Revision',
        revisionNotes: notes,
        revisionPrompt,
      })
    },
    [updateUploadedCreativeFn],
  )

  const setFinalUploadedCreativeFn = useCallback(
    (id: string) => {
      persist(prev => {
        const target = prev.uploadedCreatives.find(u => u.id === id)
        if (!target) return prev
        return {
          ...prev,
          uploadedCreatives: prev.uploadedCreatives.map(u => {
            const sameCampaign =
              u.clientId === target.clientId &&
              u.platform === target.platform &&
              u.campaignGoal === target.campaignGoal
            if (!sameCampaign) return u
            return {
              ...u,
              isFinalCampaignCreative: u.id === id,
              updatedAt: new Date().toISOString(),
            }
          }),
        }
      })
    },
    [persist],
  )

  const deleteUploadedCreativeFn = useCallback(
    (id: string) => {
      persist(prev => ({
        ...prev,
        uploadedCreatives: prev.uploadedCreatives.filter(u => u.id !== id),
      }))
    },
    [persist],
  )

  const updateCreativeStatus = useCallback(
    (id: string, status: CreativeStatus, note = '') => {
      persist(prev => ({
        ...prev,
        creatives: prev.creatives.map(c => (c.id === id ? pushApproval(c, status, note || status) : c)),
      }))
    },
    [persist],
  )

  const requestCreativeRevision = useCallback(
    (id: string, feedback: string) => {
      let created: VyronCreative | null = null
      persist(prev => {
        const base = prev.creatives.find(c => c.id === id)
        if (!base) return prev
        const familyId = base.parentId ?? base.id
        const family = prev.creatives.filter(c => c.id === familyId || c.parentId === familyId)
        const nextVersion = Math.max(...family.map(c => c.version), 0) + 1
        const now = new Date().toISOString()
        const draft = buildRevisionCreative(base, feedback, nextVersion, newId)
        const row: VyronCreative = { ...draft, createdAt: now, updatedAt: now }
        created = row
        return {
          ...prev,
          creatives: [
            row,
            ...prev.creatives.map(c => (c.id === id ? pushApproval(c, 'Revision Requested', feedback) : c)),
          ],
        }
      })
      return created
    },
    [persist],
  )

  const duplicateCreative = useCallback(
    (id: string) => {
      let dup: VyronCreative | null = null
      persist(prev => {
        const base = prev.creatives.find(c => c.id === id)
        if (!base) return prev
        const now = new Date().toISOString()
        const row: VyronCreative = {
          ...base,
          id: newId('creative'),
          status: 'Draft',
          version: 1,
          parentId: undefined,
          approvalHistory: [
            { id: newId('hist'), status: 'Draft', note: 'Duplicated creative', createdAt: now },
          ],
          createdAt: now,
          updatedAt: now,
        }
        dup = row
        return { ...prev, creatives: [row, ...prev.creatives] }
      })
      return dup
    },
    [persist],
  )

  const updateCreativeFeedback = useCallback(
    (id: string, feedback: string) => {
      persist(prev => ({
        ...prev,
        creatives: prev.creatives.map(c =>
          c.id === id ? { ...c, feedbackNotes: feedback, updatedAt: new Date().toISOString() } : c,
        ),
      }))
    },
    [persist],
  )

  const deleteCreative = useCallback(
    (id: string) => {
      persist(prev => ({ ...prev, creatives: prev.creatives.filter(c => c.id !== id) }))
    },
    [persist],
  )

  const getCreativeLaunchPrefill = useCallback(
    (id: string) => {
      const creative = storeRef.current.creatives.find(c => c.id === id)
      if (!creative) return null
      return prefillFromCreative(creative, storeRef.current.settings)
    },
    [],
  )

  const addToActionQueue = useCallback(
    (item: AddActionQueueInput) => {
      let created: VyronActionQueueItem | null = null
      persist(prev => {
        const row = normalizeActionItem(
          {
            id: newId('action'),
            ...item,
            department: item.department ?? item.sourcePage,
            status: 'pending',
            createdAt: new Date().toISOString(),
            generatedOutput: item.generatedOutput ?? '',
            notes: item.notes ?? '',
          },
          prev.settings,
        )
        created = row
        return { ...prev, actionQueue: [row, ...prev.actionQueue] }
      })
      return created!
    },
    [persist],
  )

  const startAction = useCallback(
    (id: string) => {
      persist(prev => ({
        ...prev,
        actionQueue: prev.actionQueue.map(a =>
          a.id === id && (a.status === 'pending' || a.status === 'ready_to_execute')
            ? { ...a, status: 'in_progress' as const }
            : a,
        ),
      }))
    },
    [persist],
  )

  const generateActionOutput = useCallback(
    (id: string) => {
      persist(prev => ({
        ...prev,
        actionQueue: prev.actionQueue.map(a => {
          if (a.id !== id) return a
          const output = generateExecutionOutput(a, prev.settings)
          return { ...a, generatedOutput: output, status: 'ready_to_execute' as const }
        }),
      }))
    },
    [persist],
  )

  const appendSeoPlan = useCallback(
    (id: string) => {
      persist(prev => {
        const action = prev.actionQueue.find(a => a.id === id)
        if (!action) return prev
        return {
          ...prev,
          actionQueue: prev.actionQueue.map(a =>
            a.id === id
              ? {
                  ...a,
                  generatedOutput: `${a.generatedOutput || generateExecutionOutput(a, prev.settings)}${generateSeoPlanAppend(a, prev.settings)}`,
                  status: 'ready_to_execute' as const,
                }
              : a,
          ),
        }
      })
    },
    [persist],
  )

  const appendAdsTestPlan = useCallback(
    (id: string) => {
      persist(prev => {
        const action = prev.actionQueue.find(a => a.id === id)
        if (!action) return prev
        return {
          ...prev,
          actionQueue: prev.actionQueue.map(a =>
            a.id === id
              ? {
                  ...a,
                  generatedOutput: `${a.generatedOutput || generateExecutionOutput(a, prev.settings)}${generateAdsTestPlanAppend(a, prev.settings)}`,
                  status: 'ready_to_execute' as const,
                }
              : a,
          ),
        }
      })
    },
    [persist],
  )

  const appendContentBrief = useCallback(
    (id: string) => {
      persist(prev => {
        const action = prev.actionQueue.find(a => a.id === id)
        if (!action) return prev
        return {
          ...prev,
          actionQueue: prev.actionQueue.map(a =>
            a.id === id
              ? {
                  ...a,
                  generatedOutput: `${a.generatedOutput || generateExecutionOutput(a, prev.settings)}${generateContentBriefAppend(a, prev.settings)}`,
                  status: 'ready_to_execute' as const,
                }
              : a,
          ),
        }
      })
    },
    [persist],
  )

  const updateActionNotes = useCallback(
    (id: string, notes: string) => {
      persist(prev => ({
        ...prev,
        actionQueue: prev.actionQueue.map(a => (a.id === id ? { ...a, notes } : a)),
      }))
    },
    [persist],
  )

  const completeAction = useCallback(
    (id: string) => {
      const now = new Date().toISOString()
      persist(prev => ({
        ...prev,
        actionQueue: prev.actionQueue.map(a =>
          a.id === id ? { ...a, status: 'completed' as const, completedAt: now } : a,
        ),
      }))
    },
    [persist],
  )

  const markImageCreated = useCallback(
    (id: string) => {
      const now = new Date().toISOString()
      persist(prev => ({
        ...prev,
        actionQueue: prev.actionQueue.map(a =>
          a.id === id
            ? {
                ...a,
                imageCreated: true,
                status: 'completed' as const,
                completedAt: now,
                generatedOutput: a.generatedOutput || a.advertMeta?.prompt || '',
                outputNeeded: 'Advert image exported and approved for paid social',
              }
            : a,
        ),
      }))
    },
    [persist],
  )

  const createFollowUpContentTask = useCallback(
    (actionId: string) => {
      persist(prev => {
        const action = prev.actionQueue.find(a => a.id === actionId)
        if (!action) return prev
        const task = {
          id: newId('content'),
          title: `Follow-up: ${action.title}`,
          type: 'Landing Page' as const,
          status: 'Draft' as const,
          targetKeyword: action.contextMeta?.keyword ?? action.title,
          dueDate: action.due,
        }
        return { ...prev, contentTasks: [task, ...prev.contentTasks] }
      })
    },
    [persist],
  )

  const createFollowUpGoogleAdsTask = useCallback(
    (actionId: string) => {
      persist(prev => {
        const action = prev.actionQueue.find(a => a.id === actionId)
        if (!action) return prev
        const daily = prev.settings.defaultAdDailyBudget
        const campaign = {
          id: newId('camp'),
          platform: `Google Search — ${action.contextMeta?.keyword ?? action.title}`,
          dailyBudget: daily,
          monthlyBudget: daily * 30,
          status: 'Testing' as const,
          wastedSpend: 0,
          intentScore: 88,
          notes: `Follow-up from queue: ${action.title}`,
        }
        const queueRow = normalizeActionItem(
          {
            id: newId('action'),
            title: `Launch test ads: ${action.contextMeta?.keyword ?? action.title}`,
            subtitle: `R${daily}/day test campaign`,
            department: 'Google Ads AI',
            sourcePage: 'Google Ads AI',
            priority: 'High',
            due: 'This week',
            status: 'pending',
            createdAt: new Date().toISOString(),
            executionBrief: `Create and monitor test campaign for ${action.title}`,
            nextSteps: ['Create test campaign', 'Add negatives', 'Review search terms in 48h'],
            outputNeeded: 'Live test campaign with waste keywords paused',
            kind: 'google_ads',
            contextMeta: action.contextMeta,
          },
          prev.settings,
        )
        return {
          ...prev,
          campaigns: [campaign, ...prev.campaigns],
          actionQueue: [queueRow, ...prev.actionQueue],
        }
      })
    },
    [persist],
  )

  const createFollowUpSeoTask = useCallback(
    (actionId: string) => {
      persist(prev => {
        const action = prev.actionQueue.find(a => a.id === actionId)
        if (!action) return prev
        const queueRow = normalizeActionItem(
          {
            id: newId('action'),
            title: `SEO update: ${action.contextMeta?.keyword ?? action.title}`,
            subtitle: 'Ranking content + internal links',
            department: 'SEO War Room',
            sourcePage: 'SEO War Room',
            priority: action.priority,
            due: action.due,
            status: 'pending',
            createdAt: new Date().toISOString(),
            executionBrief: `Improve rankings for ${action.contextMeta?.keyword ?? action.title}`,
            nextSteps: ['Expand landing page', 'Add FAQ schema', 'Build internal links', 'Track weekly'],
            outputNeeded: 'Measurable ranking improvement within 4 weeks',
            kind: 'seo',
            contextMeta: action.contextMeta,
          },
          prev.settings,
        )
        return { ...prev, actionQueue: [queueRow, ...prev.actionQueue] }
      })
    },
    [persist],
  )

  const createFollowUpReportTask = useCallback(
    (actionId: string) => {
      persist(prev => {
        const action = prev.actionQueue.find(a => a.id === actionId)
        if (!action) return prev
        const queueRow = normalizeActionItem(
          {
            id: newId('action'),
            title: `Client report: ${action.title}`,
            subtitle: 'Review and send executive summary',
            department: 'Reports',
            sourcePage: 'Reports',
            priority: 'Medium',
            due: 'This week',
            status: 'pending',
            createdAt: new Date().toISOString(),
            executionBrief: `Prepare report covering outcome of: ${action.title}`,
            nextSteps: ['Generate monthly report', 'Review with client', 'Send PDF', 'Log next actions'],
            outputNeeded: 'Report delivered to client',
            kind: 'general',
          },
          prev.settings,
        )
        return { ...prev, actionQueue: [queueRow, ...prev.actionQueue] }
      })
    },
    [persist],
  )

  const deleteAction = useCallback(
    (id: string) => {
      persist(prev => ({ ...prev, actionQueue: prev.actionQueue.filter(a => a.id !== id) }))
    },
    [persist],
  )

  const addContentTask = useCallback(
    (task: Omit<VyronContentTask, 'id'>) => {
      const row: VyronContentTask = { ...task, id: newId('content') }
      persist(prev => ({ ...prev, contentTasks: [row, ...prev.contentTasks] }))
    },
    [persist],
  )

  const updateContentStatus = useCallback(
    (id: string, status: VyronContentTask['status']) => {
      persist(prev => ({
        ...prev,
        contentTasks: prev.contentTasks.map(t => (t.id === id ? { ...t, status } : t)),
      }))
    },
    [persist],
  )

  const generateMonthlyReport = useCallback(
    (title?: string) => {
      let body = ''
      persist(prev => {
        const improved = prev.rankings.filter(r => r.change > 0).length
        const stuck = prev.rankings.filter(r => r.stuck).length
        const pending = prev.actionQueue.filter(
          a => a.status === 'pending' || a.status === 'in_progress' || a.status === 'ready_to_execute',
        ).length
        const completedActions = prev.actionQueue.filter(a => a.status === 'completed').length
        const period = new Date().toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })

        body = [
          `# ${title ?? `${prev.settings.defaultProject} — Monthly Marketing Report`}`,
          `Period: ${period}`,
          `Market: ${prev.settings.defaultMarket}`,
          '',
          '## Executive Summary',
          `Keywords: ${prev.keywords.length} · Rankings: ${prev.rankings.length} · Clients: ${prev.clients.length}`,
          `Action queue: ${completedActions} completed, ${pending} pending/in progress`,
          `Marketing materials: ${prev.marketingMaterials.length} · Google Ads plans: ${prev.googleAdsPlans.length}`,
          `${improved} rankings improved · ${stuck} stuck keywords need action`,
          '',
          '## What Was Created',
          ...(prev.marketingMaterials.length
            ? prev.marketingMaterials.slice(0, 10).map(m => `- [${m.platform}] ${m.title} (${m.materialType})`)
            : ['- No marketing materials saved yet']),
          ...(prev.googleAdsPlans.length
            ? prev.googleAdsPlans.slice(0, 10).map(p => `- ${p.campaignName} — R${p.dailyBudget}/day — ${p.launched ? 'Launched' : 'Draft'}`)
            : ['- No Google Ads plans saved yet']),
          '',
          '## Pending Work',
          ...prev.actionQueue
            .filter(a => a.status !== 'completed')
            .slice(0, 10)
            .map(a => `- [${statusLabel(a.status)}] ${a.title} (${a.sourcePage})`),
          '',
          '## Budget Recommendation',
          `- Google Ads test: R${prev.settings.defaultAdDailyBudget}/day (${prev.settings.defaultMarket})`,
          `- Client total budgets: R${prev.clients.reduce((s, c) => s + c.monthlyMarketingBudget, 0).toLocaleString('en-ZA')}/mo`,
          '- Scale ads only after SEO rankings validate buyer intent',
          '',
          '## Next 5 Actions',
          ...prev.actionQueue
            .filter(a => a.status !== 'completed')
            .slice(0, 5)
            .map((a, i) => `${i + 1}. [${a.priority}] ${a.title} — ${a.sourcePage}`),
          '',
          '## SEO Progress',
          ...(prev.rankings.length
            ? prev.rankings.map(
                r =>
                  `- **${r.keyword}** — #${r.position} (${r.change >= 0 ? '+' : ''}${r.change})`,
              )
            : ['- No rankings tracked yet']),
          '',
          '## Google Ads',
          `Test budget rule: R${prev.settings.defaultAdDailyBudget}/day`,
          ...prev.campaigns.map(
            c =>
              `- ${c.platform}: R${c.dailyBudget}/day (${c.status}) — intent ${c.intentScore}% — waste R${c.wastedSpend}`,
          ),
          '',
          '## Content',
          ...prev.contentTasks.map(t => `- [${t.status}] ${t.type}: ${t.title}`),
          '',
          '## Advert Image Concepts',
          ...(prev.advertConcepts.length
            ? prev.advertConcepts.map(
                a => `- [${a.platform}] ${a.productName} — ${a.style}\n  Prompt: ${a.prompt.slice(0, 200)}…`,
              )
            : ['- No advert concepts generated yet']),
          '',
          '## Keywords Tracked',
          ...(prev.keywords.length
            ? prev.keywords.map(
                k =>
                  `- ${k.keyword} (${k.intent}) — ${k.targetArea || prev.settings.defaultTargetArea}`,
              )
            : ['- No keywords added yet']),
          '',
          '## Clients',
          ...(prev.clients.length
            ? prev.clients.map(
                c =>
                  `- ${c.businessName} — ${c.industry} — R${c.monthlyMarketingBudget}/mo — ${c.targetArea}`,
              )
            : ['- No clients added yet']),
          '',
          '## Next Actions',
          ...prev.actionQueue
            .filter(
              a => a.status === 'pending' || a.status === 'in_progress' || a.status === 'ready_to_execute',
            )
            .slice(0, 8)
            .map(a => `- [${a.priority}] ${a.title} — ${a.subtitle}`),
          '',
          `Pending queue: ${pending}`,
        ].join('\n')

        const report = {
          id: newId('report'),
          title: title ?? `${prev.settings.defaultProject} — ${period}`,
          type: 'Monthly Report',
          period,
          status: 'Ready' as const,
          body,
          createdAt: new Date().toISOString(),
        }

        return { ...prev, reports: [report, ...prev.reports] }
      })
      return body
    },
    [persist],
  )

  const saveCustomReport = useCallback(
    (title: string, body: string, type = 'Marketing Director') => {
      persist(prev => {
        const period = new Date().toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
        const report = {
          id: newId('report'),
          title,
          type,
          period,
          status: 'Ready' as const,
          body,
          createdAt: new Date().toISOString(),
        }
        return { ...prev, reports: [report, ...prev.reports] }
      })
    },
    [persist],
  )

  const refresh = useCallback(() => {
    void bootstrap()
  }, [bootstrap])

  const resetAllData = useCallback(() => {
    const fresh = clearVyronReachData()
    setStore(fresh)
    setSyncError(null)
    setLastSyncedAt(null)
    const userId = userIdRef.current
    if (userId && cloudEnabled) {
      void pushToCloud(fresh, userId)
    } else {
      setSyncMode('local-only')
      setSyncStorage('local')
    }
  }, [cloudEnabled, pushToCloud])

  const loadDemoEnvironment = useCallback(() => {
    const demo = applyDemoEnvironment()
    setStore(demo)
    setSyncError(null)
    const userId = userIdRef.current
    if (userId && cloudEnabled) {
      void pushToCloud(demo, userId)
    }
  }, [cloudEnabled, pushToCloud])

  const pendingActionCount = useMemo(
    () => store.actionQueue.filter(a => a.status === 'pending').length,
    [store.actionQueue],
  )

  const value = useMemo(
    () => ({
      store,
      pendingActionCount,
      hydrated,
      syncMode,
      syncStorage,
      syncError,
      cloudEnabled,
      lastSyncedAt,
      syncNow,
      updateSettings,
      addClient,
      updateClient,
      deleteClient,
      addKeyword,
      addKeywords,
      deleteKeyword,
      addAdvertConcept,
      deleteAdvertConcept,
      addCompetitor,
      deleteCompetitor,
      addCampaign,
      deleteCampaign,
      saveGoogleAdsPlan,
      deleteGoogleAdsPlan,
      markGoogleAdsPlanLaunched,
      saveMarketingMaterial,
      deleteMarketingMaterial,
      queueActionFromMaterial,
      generateCreativeVariations: generateCreativeVariationsFn,
      saveDirectorCreativeFromAI: saveDirectorCreativeFromAIFn,
      addUploadedCreative: addUploadedCreativeFn,
      updateUploadedCreative: updateUploadedCreativeFn,
      approveUploadedCreative: approveUploadedCreativeFn,
      rejectUploadedCreative: rejectUploadedCreativeFn,
      requestUploadedCreativeRevision: requestUploadedCreativeRevisionFn,
      setFinalUploadedCreative: setFinalUploadedCreativeFn,
      deleteUploadedCreative: deleteUploadedCreativeFn,
      updateCreativeStatus,
      requestCreativeRevision,
      duplicateCreative,
      updateCreativeFeedback,
      deleteCreative,
      getCreativeLaunchPrefill,
      addToActionQueue,
      startAction,
      generateActionOutput,
      appendSeoPlan,
      appendAdsTestPlan,
      appendContentBrief,
      updateActionNotes,
      completeAction,
      markImageCreated,
      createFollowUpContentTask,
      createFollowUpGoogleAdsTask,
      createFollowUpSeoTask,
      createFollowUpReportTask,
      deleteAction,
      addContentTask,
      updateContentStatus,
      generateMonthlyReport,
      saveCustomReport,
      refresh,
      resetAllData,
      loadDemoEnvironment,
    }),
    [
      store,
      hydrated,
      syncMode,
      syncStorage,
      syncError,
      cloudEnabled,
      lastSyncedAt,
      syncNow,
      updateSettings,
      addClient,
      updateClient,
      deleteClient,
      addKeyword,
      addKeywords,
      deleteKeyword,
      addAdvertConcept,
      deleteAdvertConcept,
      addCompetitor,
      deleteCompetitor,
      addCampaign,
      deleteCampaign,
      saveGoogleAdsPlan,
      deleteGoogleAdsPlan,
      markGoogleAdsPlanLaunched,
      saveMarketingMaterial,
      deleteMarketingMaterial,
      queueActionFromMaterial,
      generateCreativeVariationsFn,
      saveDirectorCreativeFromAIFn,
      addUploadedCreativeFn,
      updateUploadedCreativeFn,
      approveUploadedCreativeFn,
      rejectUploadedCreativeFn,
      requestUploadedCreativeRevisionFn,
      setFinalUploadedCreativeFn,
      deleteUploadedCreativeFn,
      updateCreativeStatus,
      requestCreativeRevision,
      duplicateCreative,
      updateCreativeFeedback,
      deleteCreative,
      getCreativeLaunchPrefill,
      addToActionQueue,
      startAction,
      generateActionOutput,
      appendSeoPlan,
      appendAdsTestPlan,
      appendContentBrief,
      updateActionNotes,
      completeAction,
      markImageCreated,
      createFollowUpContentTask,
      createFollowUpGoogleAdsTask,
      createFollowUpSeoTask,
      createFollowUpReportTask,
      deleteAction,
      addContentTask,
      updateContentStatus,
      generateMonthlyReport,
      saveCustomReport,
      refresh,
      resetAllData,
      loadDemoEnvironment,
    ],
  )

  return <VyronDataContext.Provider value={value}>{children}</VyronDataContext.Provider>
}

export function useVyronData() {
  const ctx = useContext(VyronDataContext)
  if (!ctx) throw new Error('useVyronData must be used within VyronDataProvider')
  return ctx
}

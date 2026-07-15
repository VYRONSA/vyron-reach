'use client'

import type { ComponentType } from 'react'
import { DASHBOARD_KEY } from '@/lib/enterpriseNav'
import { OwnerDashboardPage } from '@/components/owner/pages/OwnerDashboardPage'
import { SeoWarRoomPage } from '@/components/owner/pages/SeoWarRoomPage'
import { GoogleAdsAIPage } from '@/components/owner/pages/GoogleAdsAIPage'
import { ContentEnginePage } from '@/components/owner/pages/ContentEnginePage'
import { CompetitorsPage } from '@/components/owner/pages/CompetitorsPage'
import { RankingsPage } from '@/components/owner/pages/RankingsPage'
import { ClientsPage } from '@/components/owner/pages/ClientsPage'
import { ReportsPage } from '@/components/owner/pages/ReportsPage'
import { SettingsPage } from '@/components/owner/pages/SettingsPage'
import { AIActionQueuePage } from '@/components/owner/pages/AIActionQueuePage'
import { AICreativeStudioPage } from '@/components/owner/pages/AICreativeStudioPage'
import { AIMarketingDirectorPage } from '@/components/owner/pages/AIMarketingDirectorPage'
import { SimplifiedCampaignsPage } from '@/components/owner/pages/SimplifiedCampaignsPage'

export const PAGE_REGISTRY: Record<string, ComponentType> = {
  [DASHBOARD_KEY]: OwnerDashboardPage,
  'ai-marketing-director': AIMarketingDirectorPage,
  campaigns: SimplifiedCampaignsPage,
  creatives: AICreativeStudioPage,
  clients: ClientsPage,
  settings: SettingsPage,
  // Hidden — deep links & launch flows
  'seo-war-room': SeoWarRoomPage,
  'google-ads-ai': GoogleAdsAIPage,
  'content-engine': ContentEnginePage,
  'ai-creative-studio': AICreativeStudioPage,
  competitors: CompetitorsPage,
  rankings: RankingsPage,
  reports: ReportsPage,
  'ai-action-queue': AIActionQueuePage,
}

export function getOwnerPage(key: string): ComponentType | null {
  return PAGE_REGISTRY[key] ?? null
}

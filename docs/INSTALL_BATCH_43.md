# VYRON REACH — BATCH 43 AI MARKETING OPERATOR WORKFLOW

## Included

- components/Sidebar.tsx
- components/MarketingClientIntakePage.tsx
- components/AIMarketingCommandCentrePage.tsx
- lib/marketingClientStore.ts

## Purpose

This batch continues the correct VYRON REACH direction:

- AI marketing intelligence
- business intake
- strategy-first workflow
- no CRM drift
- no payroll/HR confusion

## Suggested app/page.tsx imports

import { AIMarketingCommandCentrePage } from '@/components/AIMarketingCommandCentrePage'
import { MarketingClientIntakePage } from '@/components/MarketingClientIntakePage'
import { AIStrategyEnginePage } from '@/components/AIStrategyEnginePage'
import { GeoIntelligencePage } from '@/components/GeoIntelligencePage'
import { AdGenerationPage } from '@/components/AdGenerationPage'
import { MarketingReportPage } from '@/components/MarketingReportPage'

## Suggested render rules

if (active === 'Command Centre') return <AIMarketingCommandCentrePage />
if (active === 'Client Intake') return <MarketingClientIntakePage />
if (active === 'AI Strategy') return <AIStrategyEnginePage />
if (active === 'Geo Intelligence') return <GeoIntelligencePage />
if (active === 'Ad Generator') return <AdGenerationPage />
if (active === 'Marketing Reports') return <MarketingReportPage />

## Run

taskkill /IM node.exe /F
Remove-Item .next -Recurse -Force
npm run dev

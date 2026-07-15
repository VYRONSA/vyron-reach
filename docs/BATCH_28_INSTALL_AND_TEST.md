# VYRON REACH — BATCH 28 DRILL-DOWNS

## Included

- components/DrillDownPanel.tsx
- components/CommandCentrePage.tsx
- components/PipelinePage.tsx
- components/ReportsPage.tsx

## What changed

- Dashboard KPI cards open detail panels.
- Pipeline lead cards open lead details.
- Follow-up tasks open task details.
- Campaign cards open campaign details.
- Reports KPI cards open source records.
- Reports table rows open lead detail.

## Install

Extract into:

C:\Users\humres\vyron-reach

Overwrite existing files.

## Run

taskkill /IM node.exe /F
Remove-Item .next -Recurse -Force
npm run dev

Open:

http://localhost:3002

## Test

Click:
- Command Centre KPIs
- Pipeline cards
- Follow-up tasks
- Campaign cards
- Reports KPI cards
- Reports table rows

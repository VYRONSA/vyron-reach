# VYRON REACH — BATCH 30 CLEANUP

## What this batch does

This batch deliberately simplifies VYRON REACH.

Visible navigation is reduced to:

- Command Centre
- Pipeline
- Leads
- Campaigns
- Reports
- System Settings

Hidden from sidebar:

- Outreach
- Content Planner
- extra placeholder systems
- scattered expansion pages

The goal is to make the system feel powerful, focused and not overwhelming.

## Full-page drill-downs

The following pages now use full-page drill-downs:

- Command Centre
- Pipeline
- Leads
- Campaigns
- Reports

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

- Command Centre KPI cards
- Command Centre pipeline cards
- Pipeline cards
- Leads cards
- Campaign cards
- Report cards

Expected:

- Full-page drill-down opens
- Close Full Page returns to page
- Sidebar feels simpler
- No extra overwhelming pages visible

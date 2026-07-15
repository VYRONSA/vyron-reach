# VYRON REACH — BATCH 24 INSTALL AND TEST

## Install

Extract into:

C:\Users\humres\vyron-reach

Overwrite existing files.

## Start

taskkill /IM node.exe /F
Remove-Item .next -Recurse -Force
npm run dev

Open:

http://localhost:3002

## Test

Click:

- Command Centre
- Pipeline
- Leads
- Campaigns
- Reports
- Outreach
- Content Planner
- System Settings

Expected:

- No red runtime errors
- No missing exports
- No undefined crashes
- Revenue dashboard visible
- Sidebar cleaner and focused
- Reports export button works

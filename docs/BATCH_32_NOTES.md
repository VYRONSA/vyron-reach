# VYRON REACH — BATCH 32

## Change

Drill-downs no longer open as an overlay or small right drawer.

They now open as a proper full workspace page while the main VYRON sidebar remains visible.

## Back behaviour

Every drill-down page has a top-left Back button:

- Back to Command Centre
- Back to Leads
- Back to Campaigns
- Back to Pipeline
- Back to Reports

This returns to the exact page state inside the currently selected sidebar option.

## Install

Extract into:

C:\Users\humres\vyron-reach

Overwrite files.

## Run

taskkill /IM node.exe /F
Remove-Item .next -Recurse -Force
npm run dev

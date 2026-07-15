# VYRON REACH — BATCH 23 TEST PASS

## Purpose

This batch is not for adding more features.

This batch is for stabilising and testing VYRON REACH before we continue.

## Run

Open PowerShell in:

```text
C:\Users\humres\vyron-reach
```

Run:

```text
.\scripts\vyron-reach-clean-start.ps1
```

Open:

```text
http://localhost:3002
```

## Manual Test Checklist

### 1. App opens
- No red runtime error
- Login works
- Main dashboard loads
- Sidebar loads
- Header loads

### 2. Sidebar navigation
Click every sidebar item:
- Command Centre
- Leads
- Pipeline
- Campaigns
- Reports
- Outreach
- Content Planner
- System Settings

Expected:
- Page changes
- No crash
- No undefined errors

### 3. Demo data
Open:

```text
http://localhost:3002/demo-data
```

Click demo data generator.

Then return to:

```text
http://localhost:3002
```

Expected:
- Leads appear
- Campaigns appear
- Pipeline has values
- Reports show values

### 4. Revenue dashboard
Expected:
- Pipeline value visible
- MRR values visible
- Demos / proposals / client counts visible
- No NaN values
- No undefined values

### 5. Console check
Press:

```text
F12
```

Go to Console.

Expected:
- No red TypeError
- No missing export error
- No missing module error

## If anything breaks

Send the exact red error screen.

Do not add more batches until the current build opens cleanly.

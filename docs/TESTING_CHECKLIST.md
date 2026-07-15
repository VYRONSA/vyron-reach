# VYRON REACH — FINAL TEST CHECKLIST

Run:

```powershell
cd C:\Users\humres\vyron-reach
taskkill /IM node.exe /F
Remove-Item .next -Recurse -Force
npm run dev
```

Open:

```text
http://localhost:3002
```

## Test every visible page

- Command Centre
- Pipeline
- Leads
- Campaigns
- Reports
- System Settings

## Test drill-downs

Click:

- KPI cards
- Lead cards
- Campaign cards
- Report cards
- Reminder cards
- Follow-up task cards

Expected:

- Sidebar remains visible
- Full page detail opens
- Back button returns to exact page
- No runtime errors

## Test search

Search:

- company names
- lead names
- email addresses
- statuses
- campaigns

Expected:

- records filter
- cards remain clickable
- no crash on empty results

## Test red reminders

Expected:

- overdue tasks show red
- leads without follow-up show red
- reminders open drill-down

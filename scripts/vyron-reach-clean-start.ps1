Write-Host ""
Write-Host "VYRON REACH CLEAN START" -ForegroundColor Cyan
Write-Host "Stopping Node processes..." -ForegroundColor Yellow

taskkill /IM node.exe /F 2>$null

Write-Host "Clearing Next.js cache..." -ForegroundColor Yellow

if (Test-Path ".next") {
  Remove-Item .next -Recurse -Force
}

Write-Host "Starting VYRON REACH..." -ForegroundColor Green
Write-Host ""
Write-Host "Open: http://localhost:3002" -ForegroundColor Cyan
Write-Host ""

npm run dev

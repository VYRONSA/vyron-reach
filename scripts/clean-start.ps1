Write-Host "Starting VYRON REACH clean..." -ForegroundColor Cyan

taskkill /IM node.exe /F 2>$null

if (Test-Path ".next") {
  Remove-Item .next -Recurse -Force
}

Write-Host "Running npm dev..." -ForegroundColor Green
npm run dev

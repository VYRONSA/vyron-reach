Write-Host "VYRON REACH Production Check" -ForegroundColor Cyan

Write-Host "Checking package install..." -ForegroundColor Yellow
npm install

Write-Host "Running build..." -ForegroundColor Yellow
npm run build

Write-Host "If build passes, app is closer to deployment-ready." -ForegroundColor Green

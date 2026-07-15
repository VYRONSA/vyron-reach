taskkill /IM node.exe /F

if (Test-Path ".next") {
  Remove-Item .next -Recurse -Force
}

npm run dev

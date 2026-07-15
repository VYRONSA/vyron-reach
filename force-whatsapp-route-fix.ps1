$ErrorActionPreference = "Stop"

$path = "C:\Users\humres\vyron-core-web\app\page.tsx"

if (!(Test-Path $path)) {
  throw "Could not find: $path"
}

$content = Get-Content $path -Raw

# Make sure WhatsAppActionCentreLive exists. If not, stop safely.
if ($content -notmatch "function WhatsAppActionCentreLive") {
  throw "WhatsAppActionCentreLive was not found in page.tsx. Re-run the WhatsApp engine pack first."
}

# 1. Remove old direct routes that still send Notifications to the old queue.
$content = [regex]::Replace(
  $content,
  'if \(active === "Employee Notifications"\)[^\n]*return [^;]+;',
  ''
)

$content = [regex]::Replace(
  $content,
  'if \(active === "Notifications"\)[^\n]*return [^;]+;',
  ''
)

$content = [regex]::Replace(
  $content,
  'if \(active === "WhatsApp"\)[^\n]*return [^;]+;',
  ''
)

# 2. Handle multiline old routes.
$content = [regex]::Replace(
  $content,
  'if \(active === "Employee Notifications"\) \{[\s\S]*?\n\s*\}',
  ''
)

$content = [regex]::Replace(
  $content,
  'if \(active === "Notifications"\) \{[\s\S]*?\n\s*\}',
  ''
)

$content = [regex]::Replace(
  $content,
  'if \(active === "WhatsApp"\) \{[\s\S]*?\n\s*\}',
  ''
)

# 3. Insert the WhatsApp route immediately before the fallback screen.
$routeBlock = @'
    if (
      active === "Employee Notifications" ||
      active === "Notifications" ||
      active === "WhatsApp" ||
      active === "WhatsApp Action Centre"
    ) {
      return (
        <WhatsAppActionCentreLive
          employees={employees}
          leaveRequests={leaveRequests}
          hrCases={hrCases}
          payrollHours={payrollHours}
          setActive={setActive}
        />
      );
    }

'@

if ($content -notmatch 'active === "WhatsApp Action Centre"') {
  $content = $content.Replace(
    '    return <EmptyWorkAreaScreen title={active} setActive={setActive} />;',
    $routeBlock + '    return <EmptyWorkAreaScreen title={active} setActive={setActive} />;'
  )
}

# 4. Change any buttons that still route to Employee Notifications to use WhatsApp Action Centre.
$content = $content.Replace('setActive("Employee Notifications")', 'setActive("WhatsApp Action Centre")')
$content = $content.Replace('setActive("Notifications")', 'setActive("WhatsApp Action Centre")')

Set-Content -Path $path -Value $content -Encoding UTF8

Write-Host ""
Write-Host "WhatsApp route force-fix applied."
Write-Host "Employee Notifications / Notifications / WhatsApp now open WhatsApp Action Centre."
Write-Host ""
Write-Host "Restart:"
Write-Host "cd C:\Users\humres\vyron-core-web"
Write-Host "taskkill /IM node.exe /F"
Write-Host "Remove-Item .next -Recurse -Force"
Write-Host "npm run dev"

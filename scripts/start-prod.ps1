# Pisi: zagon produkcijskega strežnika na portu 3001 (tudi za telefon v LAN).
# Zažene ga opravilo „Pisi produkcija“ ob prijavi v Windows (glej
# scripts/install-autostart.ps1). Če je koda novejša od zadnjega builda,
# najprej naredi `npm run build`. Dnevnik: scripts/start-prod.log

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$log = Join-Path $PSScriptRoot "start-prod.log"
$port = 3001

Set-Location $root
Start-Transcript -Path $log -Force | Out-Null

try {
  if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
    Write-Output "Port $port je že zaseden (strežnik že teče?) — končujem."
    return
  }

  # Build, če ga ni ali je katerakoli izvorna datoteka novejša od njega.
  $buildId = Join-Path $root ".next\BUILD_ID"
  $needBuild = -not (Test-Path $buildId)
  if (-not $needBuild) {
    $builtAt = (Get-Item $buildId).LastWriteTime
    $sources = @("src", "public") | ForEach-Object { Get-ChildItem (Join-Path $root $_) -Recurse -File }
    $sources += Get-Item (Join-Path $root "next.config.ts"), (Join-Path $root "package.json")
    $needBuild = [bool]($sources | Where-Object { $_.LastWriteTime -gt $builtAt } | Select-Object -First 1)
  }
  if ($needBuild) {
    Write-Output "Koda je novejša od builda — npm run build ..."
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build ni uspel (exit $LASTEXITCODE)." }
  }

  Write-Output "Zaganjam Next.js na portu $port ..."
  node (Join-Path $root "node_modules\next\dist\bin\next") start -p $port -H 0.0.0.0
}
finally {
  Stop-Transcript | Out-Null
}

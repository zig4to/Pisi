# Registrira opravilo „Pisi produkcija“, ki ob prijavi v Windows (skrito)
# zažene scripts/start-prod.ps1. Ponovni zagon te skripte opravilo posodobi.
# Odstranitev: Unregister-ScheduledTask -TaskName "Pisi produkcija" -Confirm:$false

$script = Join-Path $PSScriptRoot "start-prod.ps1"

$action = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$script`""
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit ([TimeSpan]::Zero) -StartWhenAvailable

Register-ScheduledTask -TaskName "Pisi produkcija" -Action $action -Trigger $trigger `
  -Settings $settings -Description "Pisi: produkcijski Next.js strežnik na portu 3001" -Force | Out-Null

Write-Output "Opravilo 'Pisi produkcija' je registrirano (zagon ob prijavi)."

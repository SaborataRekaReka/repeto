$ErrorActionPreference = 'SilentlyContinue'

function Stop-ProcTree {
  param([int]$ProcId)

  if (-not $ProcId -or $ProcId -eq 0 -or $ProcId -eq $PID) {
    return
  }

  # Kill the full process tree first, then force-stop as a fallback.
  taskkill /PID $ProcId /T /F *> $null
  Stop-Process -Id $ProcId -Force -ErrorAction SilentlyContinue
}

try {
  $backendProcs = Get-CimInstance Win32_Process | Where-Object {
    $_.Name -match '^node(\.exe)?$' -and (
      $_.CommandLine -match 'repeto\\app\\backend' -or
      $_.CommandLine -match '@nestjs\\cli\\bin\\nest\.js' -or
      $_.CommandLine -match 'backend\\dist\\src\\main'
    )
  } | Select-Object -ExpandProperty ProcessId -Unique

  $portPids = @(Get-NetTCPConnection -LocalPort 3200 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)

  $targetPids = @($backendProcs + $portPids | Sort-Object -Unique)
  foreach ($processId in $targetPids) {
    Stop-ProcTree -ProcId $processId
  }
} catch {
  # best-effort cleanup only
}

exit 0

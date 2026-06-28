param(
  [string]$Target = 'http://host.docker.internal:3000',
  [string]$ZapHome = $env:ZAP_HOME
)

$ErrorActionPreference = 'Stop'
$allowedHosts = @('localhost', '127.0.0.1', 'host.docker.internal')
$uri = [Uri]$Target

if ($uri.Scheme -ne 'http' -or $uri.Host -notin $allowedHosts -or $uri.Port -ne 3000) {
  throw "Objetivo rechazado. DAST frontend solo permite http://localhost:3000, http://127.0.0.1:3000 o http://host.docker.internal:3000."
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$reportsDir = Join-Path $PSScriptRoot 'reports'
New-Item -ItemType Directory -Force -Path $reportsDir | Out-Null
if ($IsLinux) {
  & chmod 777 $reportsDir
}

$dockerCommand = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerCommand) {
  & docker version *> $null
  if ($LASTEXITCODE -eq 0) {
    $dockerArgs = @(
      'run', '--rm',
      '--add-host=host.docker.internal:host-gateway',
      '-v', "${repoRoot}:/zap/wrk:rw",
      '-t', 'ghcr.io/zaproxy/zaproxy:stable',
      'zap-baseline.py',
      '-t', $Target,
      '-m', '1',
      '-r', 'dast/reports/frontend-baseline.html',
      '-J', 'dast/reports/frontend-baseline.json',
      '-w', 'dast/reports/frontend-baseline.md'
    )

    & docker @dockerArgs
    exit $LASTEXITCODE
  }
}

if (-not $ZapHome) {
  $ZapHome = 'C:\tmp\ZAP_2.17.0'
}

$zapBat = Join-Path $ZapHome 'zap.bat'
if (-not (Test-Path $zapBat)) {
  throw "No se encontro Docker operativo ni ZAP portable en $ZapHome."
}

$nativeTarget = if ($uri.Host -eq 'host.docker.internal') { 'http://127.0.0.1:3000' } else { $Target }
$env:DAST_TARGET = $nativeTarget.TrimEnd('/')
$env:DAST_REPORT_DIR = $reportsDir
$planPath = (Resolve-Path (Join-Path $PSScriptRoot 'zap-native-baseline.yaml')).Path
$zapUserDir = Join-Path $env:TEMP 'emeet-zap-frontend'

Push-Location $ZapHome
try {
  & $zapBat '-cmd' '-silent' '-dir' $zapUserDir `
    '-config' 'autoupdate.checkOnStart=false' `
    '-config' 'autoupdate.downloadNewRelease=false' `
    '-config' 'autoupdate.installAddonUpdates=false' `
    '-autorun' $planPath
  $exitCode = $LASTEXITCODE
} finally {
  Pop-Location
}

exit $exitCode

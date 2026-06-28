param(
  [string]$Target = 'http://host.docker.internal:3000'
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

& docker version | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw 'Docker no esta disponible.'
}

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

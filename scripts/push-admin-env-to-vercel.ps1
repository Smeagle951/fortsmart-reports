# Cadastro ADMIN_* no projeto Vercel `fortsmart-reports`
# Pré-requisito: vercel login (uma vez)
#
# Uso (PowerShell, na pasta fortsmart_report):
#   .\scripts\push-admin-env-to-vercel.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$envFile = Join-Path $root '.env.admin.local'
if (-not (Test-Path $envFile)) {
  Write-Error "Arquivo $envFile não encontrado. Gere as chaves primeiro."
}

$map = @{}
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $parts = $_.Split('=', 2)
  if ($parts.Length -eq 2) { $map[$parts[0].Trim()] = $parts[1].Trim() }
}

$pwd = $map['ADMIN_PASSWORD']
$secret = $map['ADMIN_SESSION_SECRET']
if (-not $pwd -or -not $secret) {
  Write-Error 'ADMIN_PASSWORD ou ADMIN_SESSION_SECRET ausente em .env.admin.local'
}

foreach ($target in @('production', 'preview', 'development')) {
  Write-Host ">>> ADMIN_PASSWORD ($target)"
  $pwd | vercel env add ADMIN_PASSWORD $target --force
  Write-Host ">>> ADMIN_SESSION_SECRET ($target)"
  $secret | vercel env add ADMIN_SESSION_SECRET $target --force
}

Write-Host ''
Write-Host 'Concluído. Faça Redeploy em Production para aplicar.'
vercel env ls | Select-String 'ADMIN_'

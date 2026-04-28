param(
  [string]$Repo = "vivaca86/pp",
  [string]$SecretsFile = ""
)

$ErrorActionPreference = "Stop"

if (-not $SecretsFile) {
  $SecretsFile = Join-Path (Split-Path -Parent $PSScriptRoot) ".cloudflare-secrets.ps1"
}

if (-not (Test-Path -LiteralPath $SecretsFile)) {
  throw "Missing secrets file: $SecretsFile"
}

. $SecretsFile

$secrets = [ordered]@{
  CLOUDFLARE_ACCOUNT_ID = $CLOUDFLARE_ACCOUNT_ID
  CLOUDFLARE_KV_NAMESPACE_ID = $CLOUDFLARE_KV_NAMESPACE_ID
  CLOUDFLARE_API_TOKEN = $CLOUDFLARE_API_TOKEN
}

foreach ($name in $secrets.Keys) {
  $value = [string]$secrets[$name]
  if (-not $value -or $value -like "PASTE_*_HERE") {
    throw "Fill $name in $SecretsFile first."
  }
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "GitHub CLI (gh) was not found on PATH."
}

gh auth status --hostname github.com | Out-Null

foreach ($name in $secrets.Keys) {
  $value = [string]$secrets[$name]
  $value | gh secret set $name --repo $Repo
  Write-Host "Set GitHub secret: $name"
}

Write-Host "Cloudflare GitHub secrets are ready for $Repo."

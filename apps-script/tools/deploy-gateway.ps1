param(
  [string]$Title = "pp-sheet-gateway",
  [switch]$Login
)

$ErrorActionPreference = "Stop"
$script:ClaspCommand = $null

function Require-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $Name"
  }
}

function Invoke-Clasp {
  param(
    [string[]]$Arguments,
    [string]$WorkingDirectory
  )

  Push-Location $WorkingDirectory
  try {
    if (-not $script:ClaspCommand) {
      throw "clasp command path is not initialized."
    }

    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
      $output = & $script:ClaspCommand @Arguments 2>&1
      $exitCode = $LASTEXITCODE
    }
    finally {
      $ErrorActionPreference = $previousPreference
    }

    $text = ($output | Out-String).Trim()
    if ($exitCode -ne 0) {
      if ([string]::IsNullOrWhiteSpace($text)) {
        throw "clasp command failed."
      }
      throw $text
    }

    return $text
  }
  finally {
    Pop-Location
  }
}

function Ensure-ClaspProject {
  param(
    [string]$ProjectDirectory,
    [string]$ProjectTitle,
    [switch]$ShouldLogin
  )

  $claspFile = Join-Path $ProjectDirectory ".clasp.json"
  $homeClasp = Join-Path $HOME ".clasprc.json"
  $localClasp = Join-Path $ProjectDirectory ".clasprc.json"

  if ($ShouldLogin -or ((-not (Test-Path $homeClasp)) -and (-not (Test-Path $localClasp)))) {
    Write-Host "Running clasp login"
    Invoke-Clasp -Arguments @("login", "--no-localhost") -WorkingDirectory $ProjectDirectory | Out-Null
  }

  if (Test-Path $claspFile) {
    return
  }

  Write-Host "Creating standalone Apps Script project"
  $tempDir = Join-Path ([IO.Path]::GetTempPath()) ("pp-sheet-clasp-" + [guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Path $tempDir | Out-Null

  try {
    Invoke-Clasp -Arguments @("create", "--type", "standalone", "--title", $ProjectTitle) -WorkingDirectory $tempDir | Out-Null
    $tempClasp = Join-Path $tempDir ".clasp.json"
    if (-not (Test-Path $tempClasp)) {
      throw "Failed to create .clasp.json"
    }
    Copy-Item $tempClasp $claspFile -Force
  }
  finally {
    if (Test-Path $tempDir) {
      Remove-Item $tempDir -Recurse -Force
    }
  }
}

Require-Command node
Require-Command npm

$claspCmdCandidate = Join-Path $env:APPDATA "npm\\clasp.cmd"
if (Test-Path $claspCmdCandidate) {
  $script:ClaspCommand = $claspCmdCandidate
}
else {
  Require-Command clasp
  $script:ClaspCommand = "clasp"
}

$toolDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = (Resolve-Path (Join-Path $toolDir "..")).Path

Ensure-ClaspProject -ProjectDirectory $projectDir -ProjectTitle $Title -ShouldLogin:$Login

Write-Host "Pushing Apps Script files"
Invoke-Clasp -Arguments @("push", "-f") -WorkingDirectory $projectDir | Out-Null

$claspFile = Join-Path $projectDir ".clasp.json"
$claspConfig = Get-Content -Raw -Encoding UTF8 $claspFile | ConvertFrom-Json
$scriptId = [string]$claspConfig.scriptId
$editorUrl = "https://script.google.com/d/$scriptId/edit"

Write-Host ""
Write-Host "Push complete"
Write-Host "scriptId  : $scriptId"
Write-Host "editorUrl : $editorUrl"
Write-Host ""
Write-Host "Next steps"
Write-Host "1. Open the editor URL"
Write-Host "2. Deploy > New deployment > Web app"
Write-Host "3. Execute as: Me"
Write-Host "4. Who has access: Anyone"
Write-Host "5. Copy the /exec URL into ..\\config.js"

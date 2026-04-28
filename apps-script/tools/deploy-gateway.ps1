param(
  [string]$Title = "pp-sheet-gateway",
  [switch]$Login,
  [string]$DeploymentId = "",
  [string]$Description = ""
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

function Resolve-DeploymentId {
  param(
    [string]$RequestedDeploymentId,
    [string]$ProjectDirectory
  )

  if (-not [string]::IsNullOrWhiteSpace($RequestedDeploymentId)) {
    return $RequestedDeploymentId.Trim()
  }

  $configPath = Resolve-Path (Join-Path $ProjectDirectory "..\\config.js") -ErrorAction SilentlyContinue
  if ($configPath) {
    $configText = Get-Content -Raw -Encoding UTF8 $configPath.Path
    $match = [regex]::Match($configText, "script\.google\.com/macros/s/([^/]+)/exec")
    if ($match.Success) {
      return $match.Groups[1].Value
    }
  }

  return ""
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
$resolvedDeploymentId = Resolve-DeploymentId -RequestedDeploymentId $DeploymentId -ProjectDirectory $projectDir
$deployDescription = if ([string]::IsNullOrWhiteSpace($Description)) {
  "Automated deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
}
else {
  $Description
}

if (-not [string]::IsNullOrWhiteSpace($resolvedDeploymentId)) {
  Write-Host "Deploying existing web app deployment"
  $deployOutput = Invoke-Clasp -Arguments @(
    "deploy",
    "-i",
    $resolvedDeploymentId,
    "-d",
    $deployDescription
  ) -WorkingDirectory $projectDir
}

Write-Host ""
if ([string]::IsNullOrWhiteSpace($resolvedDeploymentId)) {
  Write-Host "Push complete"
}
else {
  Write-Host "Deploy complete"
}
Write-Host "scriptId  : $scriptId"
Write-Host "editorUrl : $editorUrl"
if (-not [string]::IsNullOrWhiteSpace($resolvedDeploymentId)) {
  Write-Host "deploymentId: $resolvedDeploymentId"
  Write-Host $deployOutput
}
else {
  Write-Host ""
  Write-Host "Next steps"
  Write-Host "1. Open the editor URL"
  Write-Host "2. Deploy > New deployment > Web app"
  Write-Host "3. Execute as: Me"
  Write-Host "4. Who has access: Anyone"
  Write-Host "5. Copy the /exec URL into ..\\config.js"
}

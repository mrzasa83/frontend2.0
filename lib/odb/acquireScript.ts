/**
 * Generates DataView-Acquire.ps1 — the client half of the proof of concept.
 *
 * Why a script rather than plain browser downloads: a browser can put files in
 * Downloads and nothing else. It cannot clear the previous acquire, it cannot
 * unpack into the viewer's job root, and it cannot tell us what the viewer
 * install actually looks like on a floor PC. The script does those four things
 * and prints what it found, which is the part of this proof of concept that
 * has to survive contact with a real install.
 *
 * Everything site-specific is a parameter with a default, so IT can settle the
 * viewer path and the download folder by editing two lines at the top rather
 * than by rebuilding anything.
 */

import type { DataType } from './archive'

export type AcquireFile = {
  job: string
  type: DataType
  rev: string
  name: string
  bytes: number
  url: string
}

export type AcquireOptions = {
  files: AcquireFile[]
  viewerRoot: string
  jobsDir: string
  user: string
  expiresAt: Date
  generatedAt?: Date
}

/** PowerShell single-quoted literal. */
const ps = (s: string) => `'${String(s).replace(/'/g, "''")}'`

export function buildAcquireScript(o: AcquireOptions): string {
  const manifest = JSON.stringify(o.files.map(f => ({
    job: f.job, type: f.type, rev: f.rev,
    name: f.name, bytes: f.bytes, url: f.url,
  })))
  // The manifest rides in a single-quoted here-string, which PowerShell takes
  // literally. JSON.stringify emits no newlines, so no line of it can close
  // the here-string.
  const generated = (o.generatedAt || new Date()).toLocaleString('en-US')
  const totalBytes = o.files.reduce((n, f) => n + (f.bytes || 0), 0)

  return `<#
  DataView acquire — frontend2.0
  ------------------------------------------------------------------
  Generated ${generated} for ${o.user}
  ${o.files.length} file(s), ${(totalBytes / 1048576).toFixed(1)} MB
  Download links expire ${o.expiresAt.toLocaleString('en-US')}

  What it does, in order:
    1. finds the ODB++ Viewer and reads its env_file (VALOR_DIR / VALOR_TMP)
    2. removes what a previous DataView run left behind
    3. downloads each job as {datatype}{job}_{version}.tgz
    4. unpacks each one into the viewer's job root so it appears in
       the viewer's Product Model List
    5. starts the viewer

  Run it:   powershell -ExecutionPolicy Bypass -File .\\DataView-Acquire.ps1
  Look first, change nothing:   ... -File .\\DataView-Acquire.ps1 -Probe
#>

[CmdletBinding()]
param(
  # Where the ODB++ Viewer is installed on this PC.
  [string] $ViewerRoot = ${ps(o.viewerRoot)},

  # Where the .tgz files land. Keep this path SHORT — ODB++ jobs nest deeply
  # and Windows still truncates at 260 characters in most tools.
  [string] $JobsDir = ${ps(o.jobsDir)},

  # Renamed: the unpacked folder takes the download name, so two revisions of
  #   one job can sit side by side and the viewer list shows which is which.
  # Internal: the folder keeps the job name stored inside the .tgz, which is
  #   what the viewer itself would create. Revisions then collide by design.
  [ValidateSet('Renamed','Internal')] [string] $NameMode = 'Renamed',

  # Report what is here and stop. Downloads nothing, deletes nothing.
  [switch] $Probe,

  # Keep what a previous run left behind instead of removing it.
  [switch] $KeepExisting,

  # Empty the viewer's whole job root, not just DataView's own folders.
  [switch] $CleanAll,

  # Download only — don't unpack into the viewer's job root.
  [switch] $NoExtract,

  # Don't start the viewer at the end.
  [switch] $NoLaunch,

  # For an HTTPS frontend2.0 with an internal certificate.
  [switch] $SkipCertCheck
)

$ErrorActionPreference = 'Stop'
# Invoke-WebRequest spends most of its time drawing the progress bar.
$ProgressPreference = 'SilentlyContinue'

# @() around it: ConvertFrom-Json unrolls a one-element array to a bare
# object, and a single-file acquire must still iterate like a list.
$Manifest = @(@'
${manifest}
'@ | ConvertFrom-Json)

function Say      ($m) { Write-Host $m }
function Head     ($m) { Write-Host ''; Write-Host $m -ForegroundColor Cyan }
function Ok       ($m) { Write-Host "  $m" -ForegroundColor Green }
function Note     ($m) { Write-Host "  $m" -ForegroundColor DarkGray }
function Warn     ($m) { Write-Host "  $m" -ForegroundColor Yellow }
function Fail     ($m) { Write-Host "  $m" -ForegroundColor Red }

Head 'DataView acquire'
Note "Generated ${generated} for ${o.user}"
Note "$($Manifest.Count) file(s) requested"

# ---------------------------------------------------------------- 1. the viewer
Head '1. ODB++ Viewer'

if (-not (Test-Path -LiteralPath $ViewerRoot)) {
  Fail "Not found: $ViewerRoot"
  Fail 'Pass the real path with -ViewerRoot, or edit the default at the top of this script.'
  exit 1
}
Ok "Install: $ViewerRoot"

$ViewerExe = Get-ChildItem -LiteralPath $ViewerRoot -Filter 'odbviewer.exe' -Recurse -ErrorAction SilentlyContinue |
  Select-Object -First 1
if ($ViewerExe) { Ok "Executable: $($ViewerExe.FullName)" }
else { Warn 'odbviewer.exe not found under the install folder; the viewer will not be started.' }

# The installer writes a plain-text env_file. VALOR_TMP is where the viewer
# unpacks a .tgz in its default Direct mode, and is therefore the folder whose
# contents the Product Model List reflects.
$EnvFile = Join-Path $ViewerRoot 'edir\\env_file'
$ValorDir = $null; $ValorTmp = $null
if (Test-Path -LiteralPath $EnvFile) {
  Ok "env_file: $EnvFile"
  $vars = @{}
  foreach ($line in (Get-Content -LiteralPath $EnvFile)) {
    if ($line -match '^\\s*([A-Z_][A-Z0-9_]*)\\s*=\\s*(.+?)\\s*$') { $vars[$Matches[1]] = $Matches[2] }
  }
  # Values reference each other as {VALOR_DIR}; resolve one level, which is all
  # the installer ever writes. Plain .Replace, not -replace: these are Windows
  # paths, and every backslash in them is a regex escape.
  foreach ($k in @($vars.Keys)) {
    $v = $vars[$k]
    foreach ($ref in @($vars.Keys)) { $v = $v.Replace('{' + $ref + '}', $vars[$ref]) }
    $vars[$k] = $v
  }
  $ValorDir = $vars['VALOR_DIR']
  $ValorTmp = $vars['VALOR_TMP']
  foreach ($k in 'VALOR_DIR','VALOR_TMP','VALOR_DIRECT_ACCESS_LIB_DIR') {
    if ($vars.ContainsKey($k)) { Note "$k = $($vars[$k])" }
  }
  if ($ValorDir -and $ValorDir -like '*{VALOR_DIR}*') {
    Warn 'VALOR_DIR still holds an unresolved placeholder — the viewer was likely never run once after install.'
  }
} else {
  Warn "No env_file at $EnvFile"
}

# Where unpacked jobs go. VALOR_TMP when we could read it, otherwise a folder
# beside the downloads so the run still finishes and the paths are visible.
$JobRoot = $ValorTmp
if (-not $JobRoot -or $JobRoot -match '[{}]') { $JobRoot = Join-Path $JobsDir 'extracted' }
Ok "Job root (Product Model List reads from here): $JobRoot"

if (Test-Path -LiteralPath $JobRoot) {
  $existing = @(Get-ChildItem -LiteralPath $JobRoot -Directory -ErrorAction SilentlyContinue)
  if ($existing.Count) { Note "Already present: $(($existing | Select-Object -First 12 | ForEach-Object Name) -join ', ')" }
  else { Note 'Empty.' }
}

$tar = Get-Command tar.exe -ErrorAction SilentlyContinue
if ($tar) { Ok "tar: $($tar.Source)" }
else { Warn 'tar.exe not found (needs Windows 10 1803 or newer) — files will be downloaded but not unpacked.' }

$StateFile = Join-Path $JobsDir 'dataview-state.json'

if ($Probe) {
  Head 'Probe only — nothing downloaded, nothing removed.'
  if (Test-Path -LiteralPath $StateFile) { Note "Previous run recorded in $StateFile" }
  Say ''
  exit 0
}

# ------------------------------------------------------------- 2. clear the old
Head '2. Clearing the previous acquire'

New-Item -ItemType Directory -Force -Path $JobsDir | Out-Null
New-Item -ItemType Directory -Force -Path $JobRoot | Out-Null

if ($KeepExisting) {
  Note 'Skipped (-KeepExisting).'
} elseif ($CleanAll) {
  # Everything, including jobs the user opened by hand. The viewer re-creates
  # what it needs, and this is the only way to be certain no older copy of a
  # job survives under the same internal name.
  Get-ChildItem -LiteralPath $JobRoot -Force -ErrorAction SilentlyContinue |
    ForEach-Object { Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue }
  Get-ChildItem -LiteralPath $JobsDir -Filter '*.tgz' -ErrorAction SilentlyContinue |
    Remove-Item -Force -ErrorAction SilentlyContinue
  Ok "Emptied $JobRoot and removed every .tgz in $JobsDir"
} else {
  # Only what a previous run of this script put there.
  $removed = 0
  if (Test-Path -LiteralPath $StateFile) {
    try {
      $prev = Get-Content -LiteralPath $StateFile -Raw | ConvertFrom-Json
      foreach ($p in @($prev.paths)) {
        if ($p -and (Test-Path -LiteralPath $p)) {
          Remove-Item -LiteralPath $p -Recurse -Force -ErrorAction SilentlyContinue
          $removed++
        }
      }
    } catch { Warn "Could not read $StateFile — $($_.Exception.Message)" }
  }
  # Plus anything matching this run's own target names, in case the state file
  # was lost but the files were not.
  foreach ($f in $Manifest) {
    foreach ($p in @((Join-Path $JobsDir $f.name), (Join-Path $JobRoot ([IO.Path]::GetFileNameWithoutExtension($f.name))))) {
      if (Test-Path -LiteralPath $p) { Remove-Item -LiteralPath $p -Recurse -Force -ErrorAction SilentlyContinue; $removed++ }
    }
  }
  Ok "Removed $removed item(s) from the previous run."
  Note 'Jobs you opened in the viewer yourself were left alone. Use -CleanAll to clear everything.'
}

# ------------------------------------------------------------------ 3. download
Head '3. Downloading'

if ($SkipCertCheck -and -not ('TrustAll' -as [type])) {
  Add-Type -TypeDefinition @"
using System.Net; using System.Security.Cryptography.X509Certificates;
public class TrustAll : ICertificatePolicy {
  public bool CheckValidationResult(ServicePoint s, X509Certificate c, WebRequest r, int p) { return true; }
}
"@
  [System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAll
}
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

$downloaded = @()
foreach ($f in $Manifest) {
  $dest = Join-Path $JobsDir $f.name
  $mb = [math]::Round($f.bytes / 1MB, 1)
  Say "  $($f.name)  ($mb MB)"
  $wc = $null
  try {
    $t0 = Get-Date
    # WebClient rather than Invoke-WebRequest: on Windows PowerShell 5.1, IWR
    # buffers the response and is several times slower on a job archive this
    # size. DownloadFile streams straight to disk.
    $wc = New-Object System.Net.WebClient
    $wc.DownloadFile($f.url, $dest)
    $secs = [math]::Round(((Get-Date) - $t0).TotalSeconds, 1)
    $got = (Get-Item -LiteralPath $dest).Length
    if ($f.bytes -gt 0 -and $got -ne $f.bytes) {
      Warn "    size differs: expected $($f.bytes) bytes, got $got"
    }
    Ok "    $secs s"
    $downloaded += [pscustomobject]@{ file = $f; path = $dest }
  } catch {
    Fail "    failed: $($_.Exception.Message)"
    # A .NET method call surfaces as MethodInvocationException, so the real
    # WebException — and the status code on it — is one level down.
    $web = $_.Exception
    if ($web.InnerException) { $web = $web.InnerException }
    $code = $null
    try { $code = $web.Response.StatusCode.value__ } catch {}
    if ($code -eq 403) {
      Fail '    The download links in this script have expired, or no longer cover this file.'
      Fail '    Build a new acquire script in DataView.'
    } elseif ($code -eq 302 -or $code -eq 401) {
      Fail '    frontend2.0 asked this download to log in. Tell whoever deployed it that'
      Fail '    /api/apps/dataview/fetch must stay exempt in proxy.ts.'
    }
    if (Test-Path -LiteralPath $dest) { Remove-Item -LiteralPath $dest -Force -ErrorAction SilentlyContinue }
  } finally {
    if ($wc) { $wc.Dispose() }
  }
}

if (-not $downloaded.Count) {
  Fail 'Nothing downloaded; stopping.'
  exit 1
}

# ------------------------------------------------------------------- 4. unpack
Head '4. Unpacking into the viewer job root'

$statePaths = @()
foreach ($d in $downloaded) { $statePaths += $d.path }

if ($NoExtract -or -not $tar) {
  Note 'Skipped. Open the .tgz files from the viewer directly:'
  foreach ($d in $downloaded) { Note "  $($d.path)" }
} else {
  foreach ($d in $downloaded) {
    $target = [IO.Path]::GetFileNameWithoutExtension($d.file.name)   # cam75336_04Feb2026
    $staging = Join-Path $JobsDir ('.staging_' + [guid]::NewGuid().ToString('N').Substring(0, 8))
    New-Item -ItemType Directory -Force -Path $staging | Out-Null
    try {
      # tar writes warnings to stderr for things it skipped. With the script's
      # Stop preference those become terminating errors, so relax it for the
      # one call and judge the result by what landed on disk instead.
      $prevEap = $ErrorActionPreference
      $ErrorActionPreference = 'Continue'
      & tar.exe -xzf $d.path -C $staging 2>&1 | Out-Null
      $ErrorActionPreference = $prevEap
      $tops = @(Get-ChildItem -LiteralPath $staging -Directory)
      if (-not $tops.Count) {
        Warn "  $($d.file.name): nothing unpacked (tar exit $LASTEXITCODE)"
        continue
      }
      $src = $tops[0].FullName
      $internal = $tops[0].Name
      $folder = if ($NameMode -eq 'Internal') { $internal } else { $target }
      $final = Join-Path $JobRoot $folder
      if (Test-Path -LiteralPath $final) { Remove-Item -LiteralPath $final -Recurse -Force -ErrorAction SilentlyContinue }
      Move-Item -LiteralPath $src -Destination $final
      $statePaths += $final
      if ($NameMode -eq 'Renamed' -and $internal -ne $folder) {
        Ok "  $folder   (job name inside the archive: $internal)"
      } else {
        Ok "  $folder"
      }
    } catch {
      Fail "  $($d.file.name): $($_.Exception.Message)"
    } finally {
      if (Test-Path -LiteralPath $staging) { Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue }
    }
  }
}

@{
  at = (Get-Date).ToString('s')
  user = ${ps(o.user)}
  jobRoot = $JobRoot
  paths = $statePaths
} | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $StateFile -Encoding UTF8

# ------------------------------------------------------------------- 5. launch
Head '5. Viewer'

if ($NoLaunch) {
  Note 'Not started (-NoLaunch).'
} elseif ($ViewerExe) {
  Start-Process -FilePath $ViewerExe.FullName -WorkingDirectory $ViewerExe.DirectoryName
  Ok 'Started. Open the job list (Product Model List) and pick one of:'
  foreach ($p in $statePaths) { if (Test-Path -LiteralPath $p -PathType Container) { Note "  $(Split-Path $p -Leaf)" } }
} else {
  Warn 'Not started — odbviewer.exe was not found.'
}

Head 'Done'
Note "Downloads: $JobsDir"
Note "Unpacked:  $JobRoot"
Say ''
`
}

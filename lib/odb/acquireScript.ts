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

/**
 * Forces the script to plain ASCII.
 *
 * Windows PowerShell 5.1 reads a .ps1 with no byte-order mark as ANSI, not
 * UTF-8, so an em dash written here comes back as three mojibake characters on
 * the floor PC. A BOM would fix the .ps1 but cannot be used in the .bat (cmd
 * chokes on one), and the .bat carries the same script. Staying inside ASCII
 * means both forms are read identically everywhere, with nothing to configure.
 */
function toAscii(s: string): string {
  return s
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—―]/g, '-')
    .replace(/…/g, '...')
    .replace(/[  ]/g, ' ')
    .replace(/[•·]/g, '*')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '?')
}

/**
 * Wraps the script in a double-clickable .bat.
 *
 * Double-clicking a .ps1 opens it in Notepad — Windows associates .ps1 with
 * "Edit" on purpose, as an anti-malware measure — and an ExecutionPolicy of
 * AllSigned or RemoteSigned blocks it besides. That is why a .bat is needed to
 * call a .ps1 at all, and the answer is the same here.
 *
 * The .ps1 rides along as base64 after an `exit /b`, so cmd never parses it and
 * nothing in the script needs batch escaping. Convert.FromBase64String ignores
 * the line breaks. The marker is found with LastIndexOf because the decoder
 * line below also contains it.
 */
export function wrapAsBatch(script: string): string {
  const b64 = Buffer.from(script, 'utf8').toString('base64')
    .replace(/(.{76})/g, '$1\r\n')
  const lines = [
    '@echo off',
    'setlocal',
    'rem  DataView acquire - double-click to run.',
    'set "DVPS=%TEMP%\\DataView-Acquire-%RANDOM%%RANDOM%.ps1"',
    'powershell -NoProfile -ExecutionPolicy Bypass -Command ' +
      '"$s=[IO.File]::ReadAllText(\'%~f0\'); $i=$s.LastIndexOf(\'#PS1BASE64#\'); ' +
      '[IO.File]::WriteAllBytes($env:DVPS,[Convert]::FromBase64String($s.Substring($i+11)))"',
    'if not exist "%DVPS%" (echo Could not unpack the script.& pause & exit /b 1)',
    'powershell -NoProfile -ExecutionPolicy Bypass -File "%DVPS%" %*',
    'del "%DVPS%" >nul 2>&1',
    'exit /b',
    '#PS1BASE64#',
    b64,
  ]
  return lines.join('\r\n') + '\r\n'
}

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

  return toAscii(`<#
  DataView acquire - frontend2.0
  ------------------------------------------------------------------
  Generated ${generated} for ${o.user}
  ${o.files.length} file(s), ${(totalBytes / 1048576).toFixed(1)} MB
  Download links expire ${o.expiresAt.toLocaleString('en-US')}

  What it does, in order:
    1. finds the ODB++ Viewer and reads its env_file (VALOR_DIR / VALOR_TMP)
    2. removes what a previous DataView run left behind, and the viewer's own
       stale unzip-* scratch folders
    3. downloads each job as {datatype}{job}_{version}.tgz
    4. starts the viewer

  It does NOT unpack by default. The viewer unpacks a .tgz itself, into its own
  unzip-genesis*.<host>.<pid> folder under VALOR_TMP, so pre-unpacking there
  would not be what it reads. Pass -Extract to try it anyway.

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

  # Report what is on this PC and stop. Downloads nothing, deletes nothing.
  # Also prints two levels of the viewer's temp folder, which is how we work
  # out what actually feeds the Product Model List.
  [switch] $Probe,

  # Unpack each .tgz under the viewer's temp folder as well as downloading it.
  # Experimental — see the header.
  [switch] $Extract,

  # With -Extract: name the unpacked folder after the download rather than
  # after the job name stored inside the archive.
  [ValidateSet('Renamed','Internal')] [string] $NameMode = 'Renamed',

  # Keep what a previous run left behind instead of removing it.
  [switch] $KeepExisting,

  # Also leave the viewer's own unzip-* scratch folders alone. Those are what
  # make the viewer re-open an older revision under the same job name, so
  # clearing them is the default.
  [switch] $KeepViewerTemp,

  # Empty the viewer's whole temp folder, not just the scratch and our own.
  [switch] $CleanAll,

  # Start the viewer with the acquired file as an argument instead of bare.
  [switch] $Open,

  # Don't start the viewer at the end.
  [switch] $NoLaunch,

  # For an HTTPS frontend2.0 with an internal certificate.
  [switch] $SkipCertCheck
)

$ErrorActionPreference = 'Stop'
# Invoke-WebRequest spends most of its time drawing the progress bar.
$ProgressPreference = 'SilentlyContinue'

# The ForEach-Object is load-bearing. Windows PowerShell 5.1's ConvertFrom-Json
# emits a JSON array as ONE un-enumerated object, so @( ... ) around it alone
# yields a one-element array holding the array — and $f.name then returns every
# name at once instead of one string. ForEach-Object enumerates it first; on
# PowerShell 7, where the array is already enumerated, it is a passthrough.
$Manifest = @(@'
${manifest}
'@ | ConvertFrom-Json | ForEach-Object { $_ })

function Say      ($m) { Write-Host $m }
function Head     ($m) { Write-Host ''; Write-Host $m -ForegroundColor Cyan }
function Ok       ($m) { Write-Host "  $m" -ForegroundColor Green }
function Note     ($m) { Write-Host "  $m" -ForegroundColor DarkGray }
function Warn     ($m) { Write-Host "  $m" -ForegroundColor Yellow }
function Fail     ($m) { Write-Host "  $m" -ForegroundColor Red }

Head 'DataView acquire'
Note "Generated ${generated} for ${o.user}"
Note "$($Manifest.Count) file(s) requested"

# If the manifest ever comes back nested or empty, every path built from it is
# wrong. Say so here rather than failing somewhere less obvious downstream.
foreach ($chk in $Manifest) {
  if (-not ($chk.name -is [string])) {
    Fail 'The embedded file list did not parse into individual files.'
    Fail "  PowerShell version: $($PSVersionTable.PSVersion)"
    Fail '  Send that line to whoever generated this script.'
    exit 1
  }
}

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
# unpacks a .tgz in its default Direct mode — one unzip-genesis*.<host>.<pid>
# folder per open, with the job inside it.
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

# The viewer's temp folder. Used for clearing stale scratch, and as the target
# when -Extract is passed. Falls back beside the downloads when env_file could
# not be read, so the run still finishes and the paths are still printed.
$JobRoot = $ValorTmp
if (-not $JobRoot -or $JobRoot -match '[{}]') { $JobRoot = Join-Path $JobsDir 'extracted' }
Ok "Viewer temp: $JobRoot"

if (Test-Path -LiteralPath $JobRoot) {
  $existing = @(Get-ChildItem -LiteralPath $JobRoot -Directory -ErrorAction SilentlyContinue)
  if ($existing.Count) { Note "Already present: $(($existing | Select-Object -First 12 | ForEach-Object Name) -join ', ')" }
  else { Note 'Empty.' }
}

$tar = Get-Command tar.exe -ErrorAction SilentlyContinue
if ($tar) { Ok "tar: $($tar.Source)" }
else { Warn 'tar.exe not found (needs Windows 10 1803 or newer).' }

$StateFile = Join-Path $JobsDir 'dataview-state.json'

if ($Probe) {
  # Two levels of the temp folder. The Product Model List shows plain job
  # names while this folder holds unzip-genesis*.<host>.<pid> wrappers, so the
  # job must sit one level down — this prints the shape so we can stop
  # guessing which of the two the viewer actually reads.
  Head 'Probe — viewer temp, two levels deep'
  if (Test-Path -LiteralPath $JobRoot) {
    foreach ($d in (Get-ChildItem -LiteralPath $JobRoot -Directory -ErrorAction SilentlyContinue | Select-Object -First 8)) {
      Say "  $($d.Name)\\"
      foreach ($c in (Get-ChildItem -LiteralPath $d.FullName -ErrorAction SilentlyContinue | Select-Object -First 10)) {
        Note "      $(if ($c.PSIsContainer) { $c.Name + '\\' } else { $c.Name })"
      }
    }
  } else { Note 'Does not exist yet.' }

  # Anything the viewer keeps beside its scratch — a recent-jobs list would
  # live here and would explain the Product Model List directly.
  Head 'Probe — files under VALOR_DIR'
  if ($ValorDir -and (Test-Path -LiteralPath $ValorDir)) {
    foreach ($c in (Get-ChildItem -LiteralPath $ValorDir -ErrorAction SilentlyContinue | Select-Object -First 25)) {
      Note "  $(if ($c.PSIsContainer) { $c.Name + '\\' } else { $c.Name })"
    }
  } else { Note 'VALOR_DIR not readable.' }

  Head 'Probe only — nothing downloaded, nothing removed.'
  if (Test-Path -LiteralPath $StateFile) { Note "Previous run recorded in $StateFile" }
  Say ''
  exit 0
}

# ------------------------------------------------------------- 2. clear the old
Head '2. Clearing the previous acquire'

New-Item -ItemType Directory -Force -Path $JobsDir | Out-Null
New-Item -ItemType Directory -Force -Path $JobRoot | Out-Null

# Nothing under the viewer's temp folder can be removed safely while the
# viewer has it open.
$viewerRunning = @(Get-Process -Name 'odbviewer','genesis' -ErrorAction SilentlyContinue).Count -gt 0
if ($viewerRunning) {
  Warn 'The viewer is running, so its temp folder is left alone. Close it and re-run for a clean slate.'
}

$removed = 0
function Drop ($path) {
  if ($path -and (Test-Path -LiteralPath $path)) {
    Remove-Item -LiteralPath $path -Recurse -Force -ErrorAction SilentlyContinue
    if (-not (Test-Path -LiteralPath $path)) { $script:removed++ }
  }
}

if ($KeepExisting) {
  Note 'Skipped (-KeepExisting).'
} else {
  # a) whatever the previous run of this script recorded
  if (Test-Path -LiteralPath $StateFile) {
    try {
      $prev = Get-Content -LiteralPath $StateFile -Raw | ConvertFrom-Json
      foreach ($p in @($prev.paths)) { Drop $p }
    } catch { Warn "Could not read $StateFile — $($_.Exception.Message)" }
  }

  # b) this run's own target names, in case the state file was lost
  foreach ($f in $Manifest) {
    Drop (Join-Path $JobsDir $f.name)
    Drop (Join-Path $JobRoot ([IO.Path]::GetFileNameWithoutExtension([string]$f.name)))
  }

  # c) the viewer's own scratch. This is the one that matters: the viewer
  #    unpacks into unzip-genesis*.<host>.<pid> and leaves it behind, and two
  #    revisions of a job carry the SAME name inside the archive — so a stale
  #    scratch folder is how you end up looking at last month's data.
  if (-not $KeepViewerTemp -and -not $viewerRunning -and (Test-Path -LiteralPath $JobRoot)) {
    $pattern = if ($CleanAll) { '*' } else { 'unzip-*' }
    foreach ($d in (Get-ChildItem -LiteralPath $JobRoot -Force -Filter $pattern -ErrorAction SilentlyContinue)) {
      Drop $d.FullName
    }
    if ($CleanAll) { Note "Emptied $JobRoot" } else { Note 'Cleared the viewer''s stale unzip-* scratch folders.' }
  }

  Ok "Removed $removed item(s)."
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
$statePaths = @()
foreach ($d in $downloaded) { $statePaths += $d.path }

if (-not $Extract) {
  # Off by default on purpose. The viewer makes its own unzip-* folder when it
  # opens a .tgz, so a copy we unpack is not what it reads.
} elseif (-not $tar) {
  Head '4. Unpacking'
  Warn 'tar.exe is not on this PC, so -Extract was skipped.'
} else {
  Head '4. Unpacking (experimental)'
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
Head "Acquired — $($downloaded.Count) of $($Manifest.Count) file(s)"
foreach ($d in $downloaded) { Ok "  $($d.path)" }

Head 'Viewer'

if ($NoLaunch) {
  Note 'Not started (-NoLaunch).'
} elseif ($ViewerExe) {
  if ($Open -and $downloaded.Count -eq 1) {
    # Whether the viewer takes a .tgz on the command line is the open question;
    # -Open is how we find out without making it the default.
    $arg = '"' + $downloaded[0].path + '"'
    Start-Process -FilePath $ViewerExe.FullName -ArgumentList $arg -WorkingDirectory $ViewerExe.DirectoryName
    Ok "Started with $($downloaded[0].path)"
  } else {
    Start-Process -FilePath $ViewerExe.FullName -WorkingDirectory $ViewerExe.DirectoryName
    Ok 'Started. Open the file(s) above from the viewer.'
    if ($downloaded.Count -eq 1) {
      Note 'To try having it open the file directly, re-run with -Open.'
    }
  }
} else {
  Warn 'Not started — odbviewer.exe was not found.'
}

Head 'Done'
Note "Downloads:   $JobsDir"
Note "Viewer temp: $JobRoot"
Say ''
if ($Host.Name -eq 'ConsoleHost' -and -not $env:DATAVIEW_NOPAUSE) {
  # Double-clicked or launched from the .bat, the window would otherwise close
  # before any of this could be read.
  Write-Host 'Press Enter to close...' -ForegroundColor DarkGray
  try { [void](Read-Host) } catch {}
}
`)
}

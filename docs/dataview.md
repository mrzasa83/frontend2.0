# DataView — proof of concept

App ▸ DataView. Find released job data in the archive, download it to the PC,
and hand it to the locally installed Siemens ODB++ Viewer.

This replaces the earlier Guacamole / Windows RDS design. No server to license,
no remote desktop, no protocol handler to register — the browser hands the user
one PowerShell script, and that script does the client-side work a browser
cannot do.

## The archive

Unchanged from what FrontVue reads:

```
{root}/{job}/{CAM|PCB}/released              ← pointer file, one line
{root}/{job}/{CAM|PCB}/04Feb2026.1055/data.tgz
```

`released` is a **pointer**: its first line names the live revision directory.
"Released" therefore means *the revision that was released*, not *the newest
folder* — a newer unreleased folder can and does exist. When the pointer is
missing, or names a folder that is not on disk, DataView falls back to the
newest revision and says so in the UI rather than quietly handing back
something else.

Root is `/archive` inside the container (the deploy script bind-mounts the host
archive there). Override with `ODB_ARCHIVE_ROOT` — the newer CAM hosts carry it
at `/mnt/shares/camfs-cam/archive`.

## Naming

`data.tgz` is renamed on the way out:

```
{datatype}{job}_{version}.tgz      cam75336_04Feb2026.tgz
```

The version is the date half of the revision folder. If two revisions of one
job share a date, both keep the time (`pcb75336_09Apr2026.1600.tgz`) so they
cannot overwrite each other.

## The acquire script

`DataView-Acquire.ps1` is generated per selection and carries the file list,
the sizes and one scoped token. Run it with **Run with PowerShell**, or:

```powershell
powershell -ExecutionPolicy Bypass -File .\DataView-Acquire.ps1
```

It:

1. finds `odbviewer.exe` under the install root and reads `edir\env_file` for
   `VALOR_DIR` / `VALOR_TMP`;
2. removes what the previous run left — its own files by default, everything
   under the job root with `-CleanAll`;
3. downloads each `.tgz` to the jobs folder;
4. unpacks each into the viewer's job root so it shows in the **Product Model
   List**;
5. starts the viewer.

Useful switches: `-Probe` (report what is on this PC, change nothing),
`-NameMode Internal`, `-NoExtract`, `-NoLaunch`, `-KeepExisting`, `-CleanAll`,
`-SkipCertCheck`, `-ViewerRoot`, `-JobsDir`.

### Why it clears the folder first

In its default Direct mode the viewer does not read a `.tgz` where it sits — it
unpacks a copy into `VALOR_TMP` and keeps it. Two revisions of one job carry
the **same job name inside the archive**, so an older unpacked copy can shadow
a newer download. Clearing is required for "always the released revision", not
just tidiness. `-NameMode Renamed` (the default) is the other half of that: the
unpacked folder takes the download name, so revisions sit side by side and the
list says which is which.

## Settings

| Env var | Default | What it is |
|---|---|---|
| `ODB_ARCHIVE_ROOT` | `/archive` | Archive mount inside the container |
| `ODB_VIEWER_ROOT` | `C:\MentorGraphics\Valor\ODB++_Viewer\odbviewer_2409` | Viewer install on the PC |
| `ODB_CLIENT_JOBS_DIR` | `C:\ODBView\jobs` | Where downloads land on the PC |
| `ODB_TOKEN_TTL_SECONDS` | `3600` | How long a generated script's links work |
| `ODB_TOKEN_SECRET` | `NEXTAUTH_SECRET` | Signing key for those links |

The last two client-side values are also editable per download, under "Where
things go on this PC" — change them there to try a path before settling it in
`deploy.sh`.

## Security

`/api/apps/dataview/fetch` is **exempt in `proxy.ts`**, because the script has
no session cookie; without the exemption the proxy would 302 it to the login
page and PowerShell would save that HTML as a `.tgz`. The route authenticates
instead on an HMAC token that:

- names the user it was minted for, which is what the server logs;
- lists exactly the files that script was built for, so it cannot be turned
  into a reader for the whole archive;
- expires.

Job numbers and revisions are the only user input that reaches the filesystem,
and both are character-validated before use, with a resolved-path check against
the archive root behind that for symlinked revision folders.

## To confirm on the first real run

1. **Does the Product Model List show the unpacked jobs?** The list is believed
   to reflect `VALOR_TMP`. The script prints the job root it used; compare that
   against what the dialog shows.
2. **Does the viewer accept a renamed job folder?** The ODB++ job name is also
   recorded inside the archive. If the viewer objects, re-run with
   `-NameMode Internal` and accept one revision at a time.
3. **Long paths.** ODB++ jobs nest deeply; `C:\ODBView\jobs` is short on
   purpose. A tar error mentioning a path length means the folder is too deep.
4. **Which install path is real on the floor**, and where IT wants the
   downloads to live.

# DataView

App ▸ DataView. Find released job data in the archive and download it, named for
the job and revision, ready to open in the locally installed ODB++ Viewer.

## Scope

DataView is a **finder and a download link**. It does not install anything, run
anything, or generate anything that runs, on the user's PC.

An earlier revision generated a PowerShell acquire script (wrapped in a .bat)
that cleared folders, downloaded files and launched the viewer. That was
withdrawn: a web page handing out a script that spawns PowerShell, decodes an
embedded payload, fetches files over the network and starts a process is the
textbook behaviour chain of a malware dropper, and the endpoint-detection
product flagged it — correctly. Convenience on the client is not worth
scripting the client. The useful half — knowing *which* revision is released —
is server-side and was never the problem.

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

`data.tgz` is renamed on the way out, by `Content-Disposition`:

```
{datatype}{job}_{version}.tgz      cam75336_04Feb2026.tgz
```

The version is the date half of the revision folder. If two revisions of one
job share a date, both keep the time (`pcb75336_09Apr2026.1600.tgz`) so they
cannot overwrite each other in the download folder.

## Opening it

Two routes, both ordinary:

1. **Download, then File ▸ Open.** The file lands in the browser's download
   folder on C:. The viewer unpacks it into its own temp folder (`VALOR_TMP`
   from `<install>\edir\env_file`), which is local, so this is fast.
2. **Open straight from the share.** Set `ODB_ARCHIVE_UNC` to the archive's
   Windows path and each revision gains a copyable share path. Paste it into
   File ▸ Open and nothing is downloaded at all. Reading one `.tgz` over the
   wire is a single large sequential read; the slow case is unpacking thousands
   of small files over the wire, which only happens if `VALOR_TMP` itself points
   somewhere network-backed.

### A note on stale revisions

The viewer keeps its unpacked copies in `VALOR_TMP` as
`unzip-genesis*.<host>.<pid>` folders, and two revisions of one job carry the
**same job name inside the archive**. An old unpacked copy can therefore shadow
a newer one. Clearing that folder is a viewer-hygiene task for whoever owns the
PC build — DataView does not touch it.

## Settings

| Env var | Default | What it is |
|---|---|---|
| `ODB_ARCHIVE_ROOT` | `/archive` | Archive mount inside the container |
| `ODB_ARCHIVE_UNC` | *(unset)* | Archive as a Windows share path; enables the copy-path route |

## Security

Both routes require a session; there are no token-authenticated endpoints and
no exemptions in `proxy.ts`. Job numbers and revisions are the only user input
that reaches the filesystem, and both are character-validated before use, with
a resolved-path check against the archive root behind that for symlinked
revision folders. Downloads are logged with the username and file.

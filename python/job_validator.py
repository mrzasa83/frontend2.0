"""
Job Validator
Checks hold list, lock status, job existence, and finds released revision.
Translates the validation logic from get_ldi_layers script 2.
"""

import logging
from typing import Dict, Any, Optional, List
from genesis_client import GenesisClient
from ldi_config import LDIConfig

logger = logging.getLogger(__name__)


class ValidationResult:
    """Result of job validation."""

    def __init__(self):
        self.valid = True
        self.errors: list = []
        self.warnings: list = []
        self.info: dict = {}
        self.debug: List[Dict[str, Any]] = []

    def add_error(self, msg: str):
        self.valid = False
        self.errors.append(msg)

    def add_warning(self, msg: str):
        self.warnings.append(msg)

    def add_debug(self, step: str, command: str = "", rc: int = 0, stdout: str = "", stderr: str = "", note: str = ""):
        self.debug.append({
            "step": step,
            "command": command,
            "rc": rc,
            "stdout": stdout.strip()[:500] if stdout else "",
            "stderr": stderr.strip()[:500] if stderr else "",
            "note": note,
        })

    def to_dict(self) -> Dict[str, Any]:
        return {
            "valid": self.valid,
            "errors": self.errors,
            "warnings": self.warnings,
            "info": self.info,
            "debug": self.debug,
        }


class JobValidator:
    """Validates jobs before LDI output."""

    def __init__(self, genesis: GenesisClient, config: LDIConfig):
        self.genesis = genesis
        self.config = config

    def validate(self, job: str) -> ValidationResult:
        """
        Run all validation checks on a job.
        Equivalent to the checks in get_ldi_layers.
        """
        result = ValidationResult()

        # Normalize job number (lowercase, strip leading zeros for old format)
        job = job.lower().strip()
        if job.startswith("0") and len(job) > 5:
            job = job.lstrip("0")

        result.info["job"] = job
        result.info["job_upper"] = job.upper()
        result.add_debug("init", note=f"Normalized job number: {job}")

        # 1. Check hold list
        self._check_hold_list(job, result)
        if not result.valid:
            return result

        # 2. Check if job exists in Genesis database
        self._check_genesis_exists(job, result)
        if not result.valid:
            return result

        # 3. Find released revision
        self._find_released_revision(job, result)
        if not result.valid:
            return result

        # 4. Check archive exists
        if result.info.get("archive_data_path"):
            archive_path = result.info["archive_data_path"]
            rc, stdout, stderr = self.genesis._run_command(f"test -f {archive_path} && echo EXISTS || echo MISSING")
            result.add_debug("check_archive", f"test -f {archive_path}", rc, stdout, stderr)
            if "MISSING" in stdout:
                result.add_error(f"Archive file not found: {archive_path}")
                return result

        # 5. Copy archive to working directory (workaround for archive permissions)
        self._copy_archive(job, result)
        if not result.valid:
            return result

        # 6. Discover layers from the copied archive
        self._peek_layers(job, result)

        # 7. Check if special job needs revision selection
        if self.config.is_special_job(job):
            rev_options = self.config.get_revision_options(job)
            result.info["needs_revision_selection"] = True
            result.info["revision_options"] = rev_options
            result.add_debug("special_job", note=f"Special job with revision options")
        else:
            result.info["needs_revision_selection"] = False

        return result

    def _check_hold_list(self, job: str, result: ValidationResult) -> None:
        """Check if job is on the hold list."""
        hold_list_path = self.config.get("hold_list_path")
        if hold_list_path:
            rc, stdout, stderr = self.genesis._run_command(f"cat {hold_list_path} 2>/dev/null")
            result.add_debug("hold_list", f"cat {hold_list_path}", rc, stdout, stderr)
            if rc == 0 and stdout.strip():
                hold_jobs = [j.strip() for j in stdout.strip().split() if j.strip()]
                if job in hold_jobs:
                    result.add_error(
                        f"Job {job} is on hold. Contact Engineering Services for Job Status."
                    )
                    result.info["on_hold"] = True
                    return

        result.info["on_hold"] = False

    def _check_genesis_exists(self, job: str, result: ValidationResult) -> None:
        """Check if job already exists in Genesis database."""
        remote_system = self.config.get_remote_system()

        rc, stdout, stderr = self.genesis._run_command(f"dbutil list jobs {job}")
        result.add_debug("dbutil_list", f"dbutil list jobs {job}", rc, stdout, stderr)
        genesis_check = stdout.strip().split() if stdout.strip() else []

        if not genesis_check:
            result.info["exists_in_genesis"] = False
            result.add_debug("genesis_check", note="Job not in Genesis database — clear to proceed")
            return

        result.info["exists_in_genesis"] = True

        # Check if job path actually exists
        rc2, stdout2, stderr2 = self.genesis._run_command(f"dbutil path jobs {job}")
        job_path = stdout2.strip() if stdout2.strip() else None
        result.add_debug("dbutil_path", f"dbutil path jobs {job}", rc2, stdout2, stderr2)

        if job_path:
            rc3, stdout3, _ = self.genesis._run_command(f"test -d {job_path} && echo EXISTS || echo MISSING")
            result.add_debug("check_job_dir", f"test -d {job_path}", rc3, stdout3)
            if "MISSING" in stdout3:
                self.genesis.dbutil_delete(job)
                result.info["exists_in_genesis"] = False
                result.info["cleaned_orphan"] = True
                result.add_warning(f"Cleaned up orphaned database entry for {job}")
                return

        # Check which system owns it
        owning_system = genesis_check[3] if len(genesis_check) >= 4 else "unknown"

        # Check lock status
        rc4, stdout4, stderr4 = self.genesis._run_command(f"dbutil lock test {job}")
        result.add_debug("dbutil_lock", f"dbutil lock test {job}", rc4, stdout4, stderr4)
        lock_parts = stdout4.strip().split()
        is_locked = lock_parts[0] == "yes" if lock_parts else False
        owner = lock_parts[1] if len(lock_parts) >= 2 else "unknown"

        if owning_system == remote_system and not is_locked:
            self.genesis.dbutil_delete(job)
            result.info["exists_in_genesis"] = False
            result.add_warning(f"Cleaned up unlocked job {job} on {remote_system}")
        elif is_locked:
            result.add_error(
                f"Job {job} is checked out by {owner} on Genesis. Contact Engineering Services."
            )
            result.info["locked_by"] = owner
        else:
            result.add_error(
                f"Job {job} exists on Genesis ({owning_system}). Contact Engineering Services."
            )

    def _find_released_revision(self, job: str, result: ValidationResult) -> None:
        """
        Find the released revision for a job from the archive.

        Ported from find_released_rev.pl (RS, 2009). The `released` file is a
        POINTER: its first line names the live revision DIRECTORY (e.g.
        "04Feb2026.1055"), so the actual data lives at
        {archive}/{job}/CAM/04Feb2026.1055/data.tgz — NOT in a file literally
        named "released".

        The read runs via genesis._run_command so it always executes on the
        SAME machine where the subsequent data.tgz copy happens — locally when
        Genesis is co-located with the container (nh2934rh today), or over SSH
        when the web server and Genesis host are split (nh3299rh plan). Both
        machines have the archive mounted (docker-compose `/mnt/archive:/archive:ro`),
        so archive_base defaults to /archive and is overridable in Admin Config.

        Original Perl:
            $release_file = "$root_dir/$job/$data_type/released";
            if (! -e $release_file) { return 0; }        # not found
            open(REV, $release_file); $rev = $lines[0];  # first line = rev dir
        """
        data_type = "CAM"
        archive_base = self.config.get_archive_base()
        cam_dir = f"{archive_base}/{job}/{data_type}"
        release_file = f"{cam_dir}/released"

        # The `released` file is a POINTER: its first line names the live
        # revision DIRECTORY, e.g. "04Feb2026.1055" → the real data lives in
        # {cam_dir}/04Feb2026.1055/. Read that pointer, then resolve the dir.
        #
        # Probe explicitly so we can tell apart three failure modes that would
        # otherwise all look like "not found":
        #   NOARCHIVE  — {archive_base}/{job} isn't visible (mount/SSH issue)
        #   NORELEASE  — job exists but has no `released` pointer file
        #   (empty)    — pointer file exists but is blank
        probe = (
            f"if [ ! -d '{archive_base}/{job}' ]; then echo NOARCHIVE; "
            f"elif [ ! -f '{release_file}' ]; then echo NORELEASE; "
            f"else head -n 1 '{release_file}'; fi"
        )
        rc, stdout, stderr = self.genesis._run_command(probe)
        result.add_debug("find_revision", probe, rc, stdout, stderr)

        out = (stdout or "").strip()

        if out == "NOARCHIVE" or rc != 0:
            result.add_error(
                f"Cannot read the archive for {job}. The archive path "
                f"'{archive_base}' isn't reachable from the Genesis host "
                f"(check the /archive mount or Admin Config → Archive Base Path)."
            )
            return
        if out == "NORELEASE":
            result.add_error(
                f"No released revision found for {job}. Contact CAM for assistance. "
                f"(no 'released' pointer file at {release_file})"
            )
            return

        revision = out
        if not revision:
            result.add_error(
                f"No released revision found for {job}. Contact CAM for assistance. "
                f"(the 'released' file at {release_file} is empty)"
            )
            return

        # The pointer's first line is the revision directory name. Guard against
        # a malformed multi-token line.
        if len(revision.split()) > 1:
            result.add_error(
                f"Unexpected content in release file for {job}: {revision[:200]}"
            )
            return

        # Resolve and verify the revision directory the pointer names.
        revision_dir = f"{cam_dir}/{revision}"
        data_tgz = f"{revision_dir}/data.tgz"
        rc_v, out_v, _ = self.genesis._run_command(
            f"test -f '{data_tgz}' && echo OK || echo NODATA"
        )
        if "OK" not in out_v:
            result.add_error(
                f"Released revision '{revision}' for {job} has no data archive. "
                f"(expected {data_tgz})"
            )
            return

        result.info["revision_path"] = revision
        result.info["archive_data_path"] = data_tgz
        result.add_debug("revision_found", note=f"Revision: {revision} → {data_tgz}")

    def _copy_archive(self, job: str, result: ValidationResult) -> None:
        """
        Copy the archive data.tgz to a working directory where we have read access.
        Workaround for archive files being owned by rob:archive.
        """
        revision = result.info.get("revision_path", "")
        archive_base = self.config.get_archive_base()
        src = f"{archive_base}/{job}/CAM/{revision}/data.tgz"
        work_dir = "/users/mrzasa/imageOut"
        dst = f"{work_dir}/{job}.tgz"

        # Ensure work dir exists
        self.genesis._run_command(f"mkdir -p {work_dir}")

        # Copy (will fail if we can't read source — debug will show why)
        cmd = f"cp {src} {dst}"
        rc, stdout, stderr = self.genesis._run_command(cmd, timeout=60)
        result.add_debug("copy_archive", cmd, rc, stdout, stderr)

        if rc != 0:
            result.add_warning(f"Could not copy archive (rc={rc}): {stderr}")
            # Store original path as fallback
            result.info["working_tgz"] = src
        else:
            # Make sure we can read it
            self.genesis._run_command(f"chmod 644 {dst}")
            result.info["working_tgz"] = dst
            result.add_debug("copy_ok", note=f"Copied to {dst}")

    def _peek_layers(self, job: str, result: ValidationResult) -> None:
        """
        Peek at available layers from the copied archive.
        Lists layer directories from the tarball.
        """
        # Use the working copy if available, otherwise try the original
        tgz_path = result.info.get("working_tgz", "")
        if not tgz_path:
            revision = result.info.get("revision_path", "")
            archive_base = self.config.get_archive_base()
            tgz_path = f"{archive_base}/{job}/CAM/{revision}/data.tgz"

        # Try tar tzf first, then tar tf, then gunzip pipe
        for method, cmd_fmt in [
            ("tzf", "tar tzf {path} | head -20"),
            ("tf", "tar tf {path} | head -20"),
            ("gunzip", "gunzip -c {path} | tar tf - | head -20"),
        ]:
            cmd = cmd_fmt.format(path=tgz_path)
            rc, stdout, stderr = self.genesis._run_command(cmd, timeout=30)
            result.add_debug(f"tar_{method}", cmd, rc, stdout, stderr)
            if rc == 0 and stdout.strip():
                tar_method = method
                break
        else:
            result.info["available_layers"] = []
            result.add_debug("layers_none", note=f"Cannot read {tgz_path}")
            return

        # Get layers using the method that worked
        if tar_method == "gunzip":
            layers_cmd = f"gunzip -c {tgz_path} | tar tf -"
        elif tar_method == "tf":
            layers_cmd = f"tar tf {tgz_path}"
        else:
            layers_cmd = f"tar tzf {tgz_path}"

        layers_cmd += (
            " | grep 'steps/panel/layers/'"
            " | sed 's|.*/steps/panel/layers/||'"
            " | cut -d/ -f1"
            " | sort -u"
        )

        rc, stdout, stderr = self.genesis._run_command(layers_cmd, timeout=30)
        result.add_debug("peek_layers_raw", layers_cmd, rc, stdout, stderr)

        if rc == 0 and stdout.strip():
            all_layers = [l.strip() for l in stdout.strip().split('\n') if l.strip()]
            # Filter: numbered layers + specific names, exclude bvia and -sp
            import re
            filtered = []
            for l in all_layers:
                if re.search(r'[1-9]', l) or l in ('dplot', 'blanktop', 'blankbot', 'blindtop', 'blindbot'):
                    if 'bvia' not in l and '-sp' not in l:
                        filtered.append(l)
            # Sort: numeric layers first, then alpha
            def layer_sort_key(name: str):
                try:
                    return (0, int(name))
                except ValueError:
                    return (1, name)
            filtered.sort(key=layer_sort_key)

            result.info["available_layers"] = filtered
            result.add_debug("layers_found", note=f"Found {len(filtered)} layers: {', '.join(filtered[:30])}")
        else:
            result.info["available_layers"] = []
            result.add_debug("layers_none", note="Could not extract layer names")

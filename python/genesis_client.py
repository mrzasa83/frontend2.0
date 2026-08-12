"""
Genesis COM Command Client
Wraps Genesis COM commands via subprocess, parsing responses back to Python dicts.
Supports both local execution and remote (SSH) execution.
"""

import subprocess
import os
import re
import tempfile
import logging
from typing import Optional, Dict, List, Any, Tuple
from pathlib import Path

logger = logging.getLogger(__name__)


class GenesisClient:
    """
    Wraps Genesis COM commands by shelling out via subprocess.
    Handles local execution or remote execution via SSH.
    """

    def __init__(
        self,
        genesis_dir: str = "/genesis",
        genesis_edir: str = "linux/e110",
        remote_host: Optional[str] = None,
        remote_user: Optional[str] = None,
        ssh_key: Optional[str] = None,
        tmp_dir: str = "/gen_dbs/tmp",
    ):
        self.genesis_dir = genesis_dir
        self.genesis_edir = genesis_edir
        self.remote_host = remote_host
        self.remote_user = remote_user or os.getenv("USER", "ldi")
        self.ssh_key = ssh_key
        self.tmp_dir = tmp_dir
        self.is_remote = remote_host is not None

    def set_host(self, host: Optional[str] = None, user: Optional[str] = None) -> None:
        """
        Reconfigure the target Genesis host/user at runtime.
        Lets the host be set from Admin Config (per-request) instead of only
        the startup env var. Passing an empty/None host reverts to local.
        """
        if host:
            self.remote_host = host
            self.is_remote = True
            if user:
                self.remote_user = user
        elif host == "":
            # Explicit local execution
            self.remote_host = None
            self.is_remote = False

    def check_license_available(self) -> Tuple[bool, str]:
        """
        Check whether a Genesis license is free before starting a job.
        The shared pool has a fixed number of seats; if all are taken the job
        would hang, so we fail cleanly with a retry-able message instead.
        Uses the Genesis license query tool; if it can't be determined we
        allow the job to proceed (fail-open) rather than block valid work.
        """
        try:
            # `licmon` / `lmstat`-style query varies by install; try the
            # Genesis-native check first, fall back to allowing the job.
            rc, out, err = self._run_command(
                "which licmon >/dev/null 2>&1 && licmon -status 2>/dev/null || echo LIC_UNKNOWN",
                timeout=20,
            )
            text = (out or "") + (err or "")
            if "LIC_UNKNOWN" in text or not text.strip():
                return True, "license status unknown (proceeding)"
            # Look for an explicit "all in use" / "0 available" signal
            low = text.lower()
            if "all licenses in use" in low or "no licenses available" in low or "0 available" in low:
                return False, "All Genesis licenses are currently in use. Please retry shortly."
            return True, "license available"
        except Exception as e:
            logger.warning(f"License check failed ({e}); proceeding")
            return True, "license check error (proceeding)"

    def _run_command(self, cmd: str, timeout: int = 120) -> Tuple[int, str, str]:
        """Execute a shell command locally or via SSH."""
        if self.is_remote:
            # Wrap in /bin/bash -c to bypass the user's csh login shell
            escaped_cmd = cmd.replace("'", "'\\''")
            remote_cmd = f"/bin/bash -c '{escaped_cmd}'"

            ssh_cmd = ["ssh", "-T"]  # -T disables pseudo-tty (reduces .cshrc noise)
            if self.ssh_key:
                ssh_cmd.extend(["-i", self.ssh_key])
            ssh_cmd.extend([
                "-o", "StrictHostKeyChecking=no",
                "-o", "ConnectTimeout=10",
                "-o", "KexAlgorithms=+diffie-hellman-group14-sha1,diffie-hellman-group1-sha1",
                "-o", "HostKeyAlgorithms=+ssh-rsa,ssh-dss",
                "-o", "PubkeyAcceptedAlgorithms=+ssh-rsa",
                f"{self.remote_user}@{self.remote_host}",
                remote_cmd
            ])
            full_cmd = ssh_cmd
        else:
            full_cmd = ["bash", "-c", cmd]

        try:
            result = subprocess.run(
                full_cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
            )
            stdout = result.stdout
            stderr = result.stderr

            # Filter out xset noise from .cshrc on apclnx01
            if self.is_remote:
                stdout = "\n".join(
                    line for line in stdout.splitlines()
                    if not line.strip().startswith("xset:")
                    and not line.strip().startswith("source ")
                    and not line.strip().startswith("setenv ")
                    and not line.strip().startswith("alias ")
                    and not line.strip().startswith("set path_to_gateway")
                )
                stderr = "\n".join(
                    line for line in stderr.splitlines()
                    if not line.strip().startswith("xset:")
                    and "Setting locale failed" not in line
                    and "Please check that your locale" not in line
                    and "LANGUAGE" not in line
                    and "LC_ALL" not in line
                    and "LC_CTYPE" not in line
                    and "LANG =" not in line
                    and "are supported and installed" not in line
                    and "Falling back to the standard locale" not in line
                    and "used only once: possible typo" not in line
                    and "Useless use of a constant" not in line
                )

            return result.returncode, stdout.strip(), stderr.strip()
        except subprocess.TimeoutExpired:
            logger.error(f"Command timed out after {timeout}s: {cmd[:100]}...")
            return -1, "", "Command timed out"
        except Exception as e:
            logger.error(f"Command failed: {e}")
            return -1, "", str(e)

    def _run_genesis_script(self, script_content: str, job: str, timeout: int = 300) -> Tuple[int, str, str]:
        """
        Run a Genesis script (csh format) that uses COM commands.
        Creates a temp script file and executes it via the Genesis get utility.
        """
        # Write the script to a temp file on the target machine
        script_name = f"ldi_web_{os.getpid()}"
        script_path = f"{self.tmp_dir}/{script_name}"

        # Create the script file
        self._run_command(f"cat > {script_path} << 'GENESIS_SCRIPT_EOF'\n{script_content}\nGENESIS_SCRIPT_EOF")
        self._run_command(f"chmod +x {script_path}")

        # Execute via Genesis get utility
        env_setup = (
            f"export GENESIS_DIR={self.genesis_dir}; "
            f"export FRONTLINE_NO_LOGIN_SCREEN=1; "
        )
        cmd = f"{env_setup} {self.genesis_dir}/{self.genesis_edir}/get/get -s{script_path} {job}"

        returncode, stdout, stderr = self._run_command(cmd, timeout=timeout)

        # Cleanup
        self._run_command(f"rm -f {script_path}")

        return returncode, stdout, stderr

    # ---- File transfer ----

    def scp_from_remote(self, remote_path: str, local_path: str, recursive: bool = False, timeout: int = 120) -> Tuple[int, str, str]:
        """Copy files from the remote Genesis server to the local container."""
        if not self.is_remote:
            # Local mode — just cp
            flag = "-r" if recursive else ""
            return self._run_command(f"cp {flag} {remote_path} {local_path}", timeout=timeout)

        scp_cmd = ["scp"]
        if recursive:
            scp_cmd.append("-r")
        if self.ssh_key:
            scp_cmd.extend(["-i", self.ssh_key])
        scp_cmd.extend([
            "-o", "StrictHostKeyChecking=no",
            "-o", "ConnectTimeout=10",
            "-o", "KexAlgorithms=+diffie-hellman-group14-sha1,diffie-hellman-group1-sha1",
            "-o", "HostKeyAlgorithms=+ssh-rsa,ssh-dss",
            "-o", "PubkeyAcceptedAlgorithms=+ssh-rsa",
            f"{self.remote_user}@{self.remote_host}:{remote_path}",
            local_path,
        ])

        try:
            result = subprocess.run(scp_cmd, capture_output=True, text=True, timeout=timeout)
            return result.returncode, result.stdout.strip(), result.stderr.strip()
        except subprocess.TimeoutExpired:
            return -1, "", "SCP timed out"
        except Exception as e:
            return -1, "", str(e)

    # ---- dbutil wrappers ----

    def dbutil_list(self, job: str) -> List[str]:
        """Check if a job exists in the Genesis database."""
        rc, stdout, stderr = self._run_command(f"dbutil list jobs {job}")
        if rc == 0 and stdout.strip():
            return stdout.strip().split()
        return []

    def dbutil_path(self, job: str) -> Optional[str]:
        """Get the filesystem path for a job."""
        rc, stdout, stderr = self._run_command(f"dbutil path jobs {job}")
        if rc == 0 and stdout.strip():
            return stdout.strip()
        return None

    def dbutil_delete(self, job: str) -> bool:
        """Delete a job from the Genesis database list."""
        rc, stdout, stderr = self._run_command(f"dbutil delete {job}")
        return rc == 0

    def dbutil_import(self, host: str, path: str) -> bool:
        """Import a job into the Genesis database."""
        rc, stdout, stderr = self._run_command(f"dbutil import {host} {path}")
        return rc == 0

    def dbutil_rename(self, old_name: str, new_name: str) -> bool:
        """Rename a job in the Genesis database."""
        rc, stdout, stderr = self._run_command(f"dbutil rename {old_name} {new_name}")
        return rc == 0

    def dbutil_lock_test(self, job: str) -> Dict[str, str]:
        """Test if a job is locked."""
        rc, stdout, stderr = self._run_command(f"dbutil lock test {job}")
        parts = stdout.strip().split()
        if len(parts) >= 1:
            result = {"locked": parts[0]}
            if len(parts) >= 2:
                result["owner"] = parts[1]
            return result
        return {"locked": "no"}

    # ---- File system helpers ----

    def file_exists(self, path: str) -> bool:
        """Check if a file or directory exists."""
        rc, _, _ = self._run_command(f"test -e {path} && echo yes || echo no")
        return rc == 0

    def list_directory(self, path: str) -> List[str]:
        """List contents of a directory."""
        rc, stdout, _ = self._run_command(f"ls {path} 2>/dev/null")
        if rc == 0:
            return [f for f in stdout.strip().split("\n") if f]
        return []

    def read_file(self, path: str) -> Optional[str]:
        """Read contents of a file."""
        rc, stdout, _ = self._run_command(f"cat {path} 2>/dev/null")
        if rc == 0:
            return stdout
        return None

    def get_file_owner(self, path: str) -> Optional[str]:
        """Get the owner of a file/directory."""
        rc, stdout, _ = self._run_command(f"ls -ld {path} 2>/dev/null | awk '{{print $3}}'")
        if rc == 0 and stdout.strip():
            return stdout.strip()
        return None

    def checksum(self, path: str) -> Optional[Tuple[str, str]]:
        """Get checksum of a file."""
        rc, stdout, _ = self._run_command(f"cksum {path}")
        if rc == 0:
            parts = stdout.strip().split()
            if len(parts) >= 2:
                return (parts[0], parts[1])
        return None

    # ---- Job layer discovery ----

    def discover_layers(self, job: str, remote_system: str = "apclnx01") -> List[str]:
        """
        Discover plottable layers for a job (equivalent to the grep pipeline in get_ldi_layers).
        Returns sorted list of layer names.
        """
        layers_path = f"/gen_dbs/mounts/{remote_system}/jobs/{job}/steps/panel/layers"
        rc, stdout, _ = self._run_command(
            f"ls {layers_path} 2>/dev/null | grep -e '[1-9]' -e dplot -e blanktop -e blankbot "
            f"-e blindtop -e blindbot | grep -v bvia | grep -v '\\-sp' | sort -n"
        )
        if rc == 0:
            return [l.strip() for l in stdout.strip().split("\n") if l.strip()]
        return []

    def get_job_steps(self, job: str, remote_system: str = "apclnx01") -> List[str]:
        """List steps in a job."""
        steps_path = f"/gen_dbs/mounts/{remote_system}/jobs/{job}/steps"
        return self.list_directory(steps_path)

    def get_layer_matrix(self, job: str, remote_system: str = "apclnx01") -> List[Dict[str, str]]:
        """
        Read per-layer attributes (type, polarity, row) from the Genesis job matrix.

        Runs a COM `get_layer_info` per layer against the matrix and parses the
        COMANS values. Returns a list of dicts:
            {"name": <layer>, "type": <signal|power_ground|...>,
             "polarity": <positive|negative>, "row": <int|None>}

        The matrix is the canonical source Genesis itself uses for the DP-100
        Core-Top / Core-Bottom output screen, so Type and Polarity come straight
        from here rather than being inferred.
        """
        layers = self.discover_layers(job, remote_system)
        if not layers:
            return []

        # Build one COM script that emits a parseable line per layer.
        # get_layer_info populates COMANS with .row / .polarity / .type etc.
        cmd_lines = ['COM open_job,job=$JOB']
        for lyr in layers:
            cmd_lines.append(f'COM get_layer_info,job=$JOB,name={lyr}')
            # Echo a delimited record we can grep out of stdout regardless of
            # how the local COMANS variables are surfaced by this Genesis build.
            cmd_lines.append(
                f'echo "LYRINFO|{lyr}|type=$COMANS(type)|polarity=$COMANS(polarity)|row=$COMANS(row)"'
            )
        cmd_lines.append('COM close_job,job=$JOB')

        result = self.run_com_script(job, cmd_lines, timeout=180)
        stdout = result.get("stdout", "") or ""

        info_map: Dict[str, Dict[str, str]] = {}
        for line in stdout.splitlines():
            if not line.startswith("LYRINFO|"):
                continue
            parts = line.strip().split("|")
            if len(parts) < 3:
                continue
            name = parts[1]
            attrs: Dict[str, str] = {}
            for kv in parts[2:]:
                if "=" in kv:
                    k, v = kv.split("=", 1)
                    attrs[k.strip()] = v.strip()
            row_raw = attrs.get("row", "")
            row_val = row_raw if row_raw and row_raw.isdigit() else None
            info_map[name] = {
                "type": attrs.get("type", "") or "",
                "polarity": attrs.get("polarity", "") or "",
                "row": row_val,
            }

        # Preserve discover_layers ordering; include layers even if the COM read
        # returned nothing for them (attributes empty -> UI falls back to defaults).
        out: List[Dict[str, str]] = []
        for lyr in layers:
            attrs = info_map.get(lyr, {})
            out.append({
                "name": lyr,
                "type": attrs.get("type", ""),
                "polarity": attrs.get("polarity", ""),
                "row": attrs.get("row"),
            })
        return out

    # ---- Genesis COM command execution ----

    def run_com_script(self, job: str, commands: List[str], timeout: int = 300) -> Dict[str, Any]:
        """
        Run a series of Genesis COM commands against a job.
        Returns dict with stdout, stderr, returncode, and any parsed COMANS values.
        """
        script_lines = [
            "#!/bin/csh -f",
            f"set JOB = {job}",
        ]
        script_lines.extend(commands)
        script_content = "\n".join(script_lines)

        rc, stdout, stderr = self._run_genesis_script(script_content, job, timeout)
        return {
            "returncode": rc,
            "stdout": stdout,
            "stderr": stderr,
        }

    # ---- High-level operations ----

    def extract_and_import_job(
        self,
        job: str,
        archive_path: str,
        remote_system: str = "apclnx01",
    ) -> Dict[str, Any]:
        """
        Extract a job archive and import into Genesis.
        Equivalent to the archive extraction section of get_ldi_layers.
        Returns dict with success status and any error messages.
        """
        jobs_dir = f"/gen_dbs/mounts/{remote_system}/jobs"
        tgz_path = f"{jobs_dir}/{job}.tgz"
        tar_path = f"{jobs_dir}/{job}.tar"

        steps = []

        # Copy archive
        rc, stdout, stderr = self._run_command(
            f"sudo -u archive cp {archive_path} {tgz_path}"
        )
        if rc != 0:
            return {"success": False, "error": f"Failed to copy archive: {stderr}", "steps": steps}
        steps.append("Archive copied")

        # Set permissions
        self._run_command(f"sudo -u archive chmod 666 {tgz_path}")

        # Decompress
        rc, stdout, stderr = self._run_command(f"cd {jobs_dir} && /bin/gunzip {job}.tgz")
        if rc != 0:
            return {"success": False, "error": f"Failed to decompress: {stderr}", "steps": steps}
        steps.append("Archive decompressed")

        # Verify checksum
        cksum = self.checksum(tar_path)
        chksum_file = archive_path.replace("data.tgz", "chksum_file")
        orig_cksum_content = self.read_file(chksum_file)
        if cksum and orig_cksum_content:
            orig_parts = orig_cksum_content.strip().split()
            if len(orig_parts) >= 2 and (cksum[0] != orig_parts[0] or cksum[1] != orig_parts[1]):
                self._run_command(f"rm -f {tar_path}")
                return {"success": False, "error": "Checksum mismatch", "steps": steps}
        steps.append("Checksum verified")

        # Extract tar
        rc, _, stderr = self._run_command(f"cd {jobs_dir} && /bin/tar xf {job}.tar && rm {job}.tar")
        if rc != 0:
            return {"success": False, "error": f"Failed to extract tar: {stderr}", "steps": steps}
        steps.append("Archive extracted")

        # Set permissions
        self._run_command(f"chmod 777 {jobs_dir}/{job}")
        self._run_command(f"chmod -R 777 {jobs_dir}/{job}/*")
        self._run_command(f"touch {jobs_dir}/{job}")

        # Import to Genesis
        if self.dbutil_import(remote_system, f"{jobs_dir}/{job}"):
            steps.append("Imported to Genesis")
        else:
            return {"success": False, "error": "Failed to import to Genesis", "steps": steps}

        return {"success": True, "steps": steps}

    def cleanup_job(self, job: str, remote_system: str = "apclnx01") -> None:
        """Remove job data and database entry after output."""
        job_path = f"/gen_dbs/mounts/{remote_system}/jobs/{job}"
        self._run_command(f"rm -rf {job_path}")
        self.dbutil_delete(job)
        # Retry after delay in case of timing issues
        import time
        time.sleep(5)
        self.dbutil_delete(job)

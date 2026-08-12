"""
LDI Backend Server
FastAPI-based HTTP server that the Next.js app calls for Genesis operations.
Provides endpoints for validation, acquisition, layer discovery, and output.
"""

import os
import logging
import asyncio
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from genesis_client import GenesisClient
from ldi_config import LDIConfig
from job_validator import JobValidator
from date_code import calculate_date_code, get_supported_formats

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize components
config = LDIConfig()
genesis = GenesisClient(
    remote_host=os.environ.get("GENESIS_HOST"),
    remote_user=os.environ.get("GENESIS_USER"),
    ssh_key=os.environ.get("GENESIS_SSH_KEY"),
)
validator = JobValidator(genesis, config)

app = FastAPI(title="LDI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Request/Response Models ----

class ValidateRequest(BaseModel):
    job: str
    genesis_host: Optional[str] = None
    genesis_user: Optional[str] = None
    archive_base_path: Optional[str] = None

class AcquireRequest(BaseModel):
    job: str
    revision_choice: Optional[int] = None  # index into revision options
    genesis_host: Optional[str] = None
    genesis_user: Optional[str] = None
    archive_base_path: Optional[str] = None

class LayerOverride(BaseModel):
    name: str
    polarity: Optional[str] = None   # "positive" | "negative"
    scale_x: Optional[float] = None  # output scale factor, default 1.0
    scale_y: Optional[float] = None

class OutputRequest(BaseModel):
    job: str
    layers: list[str]
    layer_overrides: Optional[list[LayerOverride]] = None
    machine: Optional[str] = None
    output_type: Optional[str] = "OPFX"
    output_path: Optional[str] = None
    date_code: Optional[str] = None
    date_code_format: Optional[str] = None
    date_code_manual: Optional[str] = None
    genesis_host: Optional[str] = None
    genesis_user: Optional[str] = None
    archive_base_path: Optional[str] = None
    operator: Optional[str] = None

class ConfigUpdateRequest(BaseModel):
    key: str
    value: dict | list | str

class SpecialRevisionUpdate(BaseModel):
    job: str
    prompt: str
    options: list[dict]


# ---- Health Check ----

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "genesis_host": genesis.remote_host or "local",
    }


# ---- Validation ----

@app.post("/api/validate")
async def validate_job(req: ValidateRequest):
    """
    Validate a job for LDI output.
    Checks hold list, Genesis status, finds released revision.
    """
    try:
        # Apply Genesis host + archive overrides from Admin Config (if provided)
        # Empty host -> run locally in the container (where /archive is mounted);
        # a hostname -> run Genesis over SSH on that box.
        genesis.set_host(req.genesis_host or "", req.genesis_user or "")
        if req.archive_base_path:
            config.set("archive_base_path", req.archive_base_path)

        result = validator.validate(req.job)
        return result.to_dict()
    except Exception as e:
        logger.error(f"Validation error for {req.job}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---- Acquisition ----

@app.post("/api/acquire")
async def acquire_job(req: AcquireRequest):
    """
    Acquire a job: extract archive, verify checksum, import to Genesis.
    """
    try:
        # Apply Genesis host override from Admin Config (if provided)
        # Empty host -> run locally in the container (where /archive is mounted);
        # a hostname -> run Genesis over SSH on that box.
        genesis.set_host(req.genesis_host or "", req.genesis_user or "")

        # Apply archive base path override from Admin Config (if provided)
        if req.archive_base_path:
            config.set("archive_base_path", req.archive_base_path)

        # Guard against an exhausted license pool — fail cleanly, allow retry
        lic_ok, lic_msg = genesis.check_license_available()
        if not lic_ok:
            raise HTTPException(status_code=503, detail=lic_msg)

        # Re-validate to get revision path
        validation = validator.validate(req.job)
        if not validation.valid:
            raise HTTPException(status_code=400, detail=validation.errors)

        job = validation.info["job"]
        revision_path = validation.info.get("revision_path")

        # Handle special job revision override
        if validation.info.get("needs_revision_selection") and req.revision_choice is not None:
            rev_options = validation.info["revision_options"]
            if 0 <= req.revision_choice < len(rev_options["options"]):
                chosen = rev_options["options"][req.revision_choice]
                if chosen["revision"] is not None:
                    revision_path = chosen["revision"]

        if not revision_path:
            raise HTTPException(status_code=400, detail="No revision path available")

        archive_path = f"{config.get_archive_base()}/{job}/CAM/{revision_path}/data.tgz"
        remote_system = config.get_remote_system()

        # Check if job directory already exists on target
        job_dir = f"/gen_dbs/mounts/{remote_system}/jobs/{job}"
        if genesis.file_exists(job_dir):
            tgz_check = f"{job_dir}.tgz"
            if genesis.file_exists(tgz_check):
                raise HTTPException(
                    status_code=409,
                    detail=f"Someone else is acquiring job {job}. Try again later."
                )
            else:
                genesis._run_command(f"rm -rf {job_dir}")

        # Extract and import
        result = genesis.extract_and_import_job(job, archive_path, remote_system)

        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])

        # Discover layers
        layers = genesis.discover_layers(job, remote_system)

        # Read per-layer type/polarity from the matrix (best-effort; the UI
        # falls back to name-based defaults if this comes back empty).
        try:
            layer_info = genesis.get_layer_matrix(job, remote_system)
        except Exception as e:
            logger.warning(f"Layer matrix read failed for {job}: {e}")
            layer_info = [{"name": l, "type": "", "polarity": "", "row": None} for l in layers]

        return {
            "success": True,
            "job": job,
            "revision": revision_path,
            "steps": result["steps"],
            "layers": layers,
            "layer_info": layer_info,
            "timestamp": datetime.now().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Acquisition error for {req.job}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---- Layer Discovery ----

@app.get("/api/layers/{job}")
async def get_layers(job: str):
    """Get available layers for a job that's already been imported."""
    try:
        remote_system = config.get_remote_system()
        layers = genesis.discover_layers(job.lower(), remote_system)
        steps = genesis.get_job_steps(job.lower(), remote_system)
        try:
            layer_info = genesis.get_layer_matrix(job.lower(), remote_system)
        except Exception as e:
            logger.warning(f"Layer matrix read failed for {job}: {e}")
            layer_info = [{"name": l, "type": "", "polarity": "", "row": None} for l in layers]

        return {
            "job": job.lower(),
            "layers": layers,
            "layer_info": layer_info,
            "steps": steps,
            "count": len(layers),
        }
    except Exception as e:
        logger.error(f"Layer discovery error for {job}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---- Date Code ----

@app.get("/api/date-code")
async def get_date_code(format: str = "WWYY", manual: Optional[str] = None):
    """Calculate a date code for the given format."""
    result = calculate_date_code(format, manual_value=manual)
    return result

@app.get("/api/date-code/formats")
async def list_date_code_formats():
    """List all supported date code formats with today's values."""
    formats = get_supported_formats()
    results = []
    for fmt in formats:
        dc = calculate_date_code(fmt)
        results.append({
            "format": fmt,
            "code": dc["code"],
            "auto": dc["auto"],
            "needs_manual": dc["needs_manual"],
        })
    return {"formats": results}


# ---- Output (with SSE progress streaming) ----

@app.post("/api/output")
async def output_job(req: OutputRequest):
    """
    Run the full output pipeline for a job.
    1. Copy archive to Genesis jobs dir
    2. Extract and import
    3. Run Genesis output (via legacy script runner)
    4. Copy output files to destination
    """
    async def generate_progress():
        try:
            # Apply Genesis host override from Admin Config (if provided)
            # Empty host -> run locally; a hostname -> Genesis over SSH.
            genesis.set_host(req.genesis_host or "", req.genesis_user or "")

            # Apply archive base path override from Admin Config (if provided)
            if req.archive_base_path:
                config.set("archive_base_path", req.archive_base_path)

            # Guard against an exhausted license pool — fail cleanly, allow retry
            lic_ok, lic_msg = genesis.check_license_available()
            if not lic_ok:
                yield f"data: {_json_event('error', lic_msg)}\n\n"
                return

            job = req.job.lower()
            remote_system = config.get_remote_system()
            jobs_dir = f"/gen_dbs/mounts/{remote_system}/jobs"
            work_dir = "/users/mrzasa/imageOut"
            archive_base = config.get_archive_base()
            output_path = req.output_path or ""
            output_type = req.output_type or "OPFX"
            machine = req.machine or "default"
            layer_list = ", ".join(req.layers)

            yield f"data: {_json_event('start', f'Starting {output_type} output for {job} → {machine}')}\n\n"
            yield f"data: {_json_event('progress', f'Layers: {layer_list}')}\n\n"

            # Step 1: Find the archive tgz
            working_tgz = f"{work_dir}/{job}.tgz"
            rc, stdout, _ = genesis._run_command(f"test -f {working_tgz} && echo EXISTS || echo MISSING")
            if "MISSING" in stdout:
                # The `released` file is a POINTER: its first line names the
                # live revision DIRECTORY (e.g. "04Feb2026.1055"), so the data
                # tgz is at {archive}/{job}/CAM/{revision}/data.tgz.
                release_file = f"{archive_base}/{job}/CAM/released"
                rc_r, rev_out, _ = genesis._run_command(f"head -n 1 '{release_file}' 2>/dev/null")
                revision = rev_out.strip().split()[0] if rev_out.strip() else ""
                if not revision:
                    yield f"data: {_json_event('error', f'No released revision found for {job} (looked for {release_file})')}\n\n"
                    return

                src = f"{archive_base}/{job}/CAM/{revision}/data.tgz"
                yield f"data: {_json_event('progress', f'Copying archive: {src}')}\n\n"
                rc_cp, _, stderr_cp = genesis._run_command(f"cp {src} {working_tgz}", timeout=120)
                if rc_cp != 0:
                    yield f"data: {_json_event('error', f'Cannot copy archive from {src}: {stderr_cp}')}\n\n"
                    return
            else:
                yield f"data: {_json_event('progress', f'Using cached archive: {working_tgz}')}\n\n"

            # Step 2: Clean up any existing job in Genesis
            yield f"data: {_json_event('progress', 'Checking for existing job in Genesis...')}\n\n"
            rc_list, stdout_list, _ = genesis._run_command(f"dbutil list jobs {job}")
            if stdout_list.strip():
                yield f"data: {_json_event('progress', f'Removing existing job entry...')}\n\n"
                genesis._run_command(f"dbutil delete {job}")
                genesis._run_command(f"rm -rf {jobs_dir}/{job}")

            # Step 3: Extract archive to Genesis jobs directory
            yield f"data: {_json_event('progress', f'Extracting archive to {jobs_dir}...')}\n\n"
            # Copy tgz to jobs dir, gunzip, extract
            rc_cp2, _, stderr_cp2 = genesis._run_command(f"cp {working_tgz} {jobs_dir}/{job}.tgz")
            if rc_cp2 != 0:
                yield f"data: {_json_event('error', f'Cannot copy to jobs dir: {stderr_cp2}')}\n\n"
                return

            rc_gz, _, stderr_gz = genesis._run_command(f"cd {jobs_dir} && gunzip -f {job}.tgz", timeout=60)
            if rc_gz != 0:
                yield f"data: {_json_event('error', f'Gunzip failed: {stderr_gz}')}\n\n"
                return

            rc_tar, _, stderr_tar = genesis._run_command(f"cd {jobs_dir} && tar xf {job}.tar", timeout=120)
            if rc_tar != 0:
                yield f"data: {_json_event('error', f'Tar extract failed: {stderr_tar}')}\n\n"
                return

            # Set permissions
            genesis._run_command(f"chmod -R 777 {jobs_dir}/{job}")
            genesis._run_command(f"rm -f {jobs_dir}/{job}.tar")
            yield f"data: {_json_event('progress', 'Archive extracted successfully')}\n\n"

            # Step 4: Import into Genesis database
            yield f"data: {_json_event('progress', 'Importing job into Genesis...')}\n\n"
            rc_imp, stdout_imp, stderr_imp = genesis._run_command(
                f"dbutil import {remote_system} {jobs_dir}/{job}"
            )
            if rc_imp != 0:
                yield f"data: {_json_event('error', f'Genesis import failed: {stderr_imp}')}\n\n"
                return
            yield f"data: {_json_event('progress', f'Job {job} imported into Genesis')}\n\n"

            # Step 4.5: Apply per-layer polarity / scale overrides (DP-100 parity)
            # Only layers whose values differ from the Genesis default are touched,
            # so an untouched job behaves exactly as before.
            overrides = req.layer_overrides or []
            applied = []
            for ov in overrides:
                if ov.name not in req.layers:
                    continue
                com_cmds = []
                if ov.polarity in ("positive", "negative"):
                    com_cmds.append(
                        f'COM set_layer_polarity,job=$JOB,name={ov.name},polarity={ov.polarity}'
                    )
                sx = ov.scale_x if ov.scale_x is not None else 1.0
                sy = ov.scale_y if ov.scale_y is not None else 1.0
                # Only issue a scale op when it actually differs from 1:1
                if abs(sx - 1.0) > 1e-9 or abs(sy - 1.0) > 1e-9:
                    com_cmds.append(
                        f'COM sel_resize,job=$JOB,step=panel,layer={ov.name},'
                        f'xscale={sx},yscale={sy},x_anchor=0,y_anchor=0'
                    )
                if com_cmds:
                    script = ['COM open_job,job=$JOB', 'COM set_step,job=$JOB,name=panel']
                    script.extend(com_cmds)
                    script.append('COM close_job,job=$JOB,save=yes')
                    res = genesis.run_com_script(job, script, timeout=120)
                    ok = res.get("returncode", 1) == 0
                    detail = []
                    if ov.polarity:
                        detail.append(f'pol={ov.polarity[:3].upper()}')
                    if abs(sx - 1.0) > 1e-9 or abs(sy - 1.0) > 1e-9:
                        detail.append(f'scale={sx:.4f}x{sy:.4f}')
                    label = f'{ov.name} [{", ".join(detail)}]'
                    applied.append(label)
                    verb = "Applied" if ok else "WARN could not apply"
                    yield f"data: {_json_event('progress', f'{verb}: {label}')}\n\n"
            if not applied:
                yield f"data: {_json_event('progress', 'No polarity/scale overrides — using Genesis defaults')}\n\n"

            # Step 5: Run Genesis output script
            # The legacy script uses: /genesis/linux/e110/get/get -s/genesis/sys/scripts/archive/output_ldi_files $JOB
            gen_ver = config.get("genesis_version") or 110
            gen_script = f"/genesis/linux/e{gen_ver}/get/get"
            output_script = "/genesis/sys/scripts/archive/output_ldi_files"

            yield f"data: {_json_event('progress', f'Running Genesis output script ({output_type})...')}\n\n"

            # Set environment for the script
            env_setup = (
                f"export GENESIS_DIR=/genesis && "
                f"export GENESIS_VER={gen_ver} && "
                f"export GENESIS_EDIR=/genesis/linux/e{gen_ver} && "
                f"export CALLED_FROM_LDI_ACQUIRE=1 && "
                f"export IS_SCULPTED=no"
            )

            # For now, try running the script. This needs a Genesis display/license.
            # In the future, we'll replace this with direct COM commands from our app.
            rc_out, stdout_out, stderr_out = genesis._run_command(
                f"{env_setup} && {gen_script} -x -s{output_script} {job} :0",
                timeout=300
            )

            if rc_out != 0:
                yield f"data: {_json_event('progress', f'Genesis script returned rc={rc_out} (may need display/license)')}\n\n"
                yield f"data: {_json_event('progress', f'stderr: {stderr_out[:300]}')}\n\n"
                # Don't fail — continue to check for output files
            else:
                yield f"data: {_json_event('progress', 'Genesis processing complete')}\n\n"

            # Step 6: Copy layer data to destination via SCP
            if output_path:
                yield f"data: {_json_event('progress', f'Checking for output files...')}\n\n"

                # Check the output directory on Genesis
                opfx_dir = f"{jobs_dir}/{job}/output"
                rc_ls, stdout_ls, _ = genesis._run_command(f"ls -la {opfx_dir}/ 2>/dev/null || echo NO_OUTPUT_DIR")
                yield f"data: {_json_event('progress', f'Output dir: {stdout_ls[:300]}')}\n\n"

                # Copy selected layer data from apclnx01 to local destination via SCP
                dest_dir = f"{output_path}/{job}"
                import os as _os
                _os.makedirs(dest_dir, exist_ok=True)

                yield f"data: {_json_event('progress', f'Copying layers to {dest_dir}...')}\n\n"
                copied_count = 0
                for layer in req.layers:
                    layer_src = f"{jobs_dir}/{job}/steps/panel/layers/{layer}"
                    # Check if layer exists on remote
                    rc_chk, stdout_chk, _ = genesis._run_command(f"test -d {layer_src} && echo EXISTS || echo MISSING")
                    if "EXISTS" in stdout_chk:
                        layer_dest = f"{dest_dir}/{layer}"
                        _os.makedirs(layer_dest, exist_ok=True)
                        rc_scp, _, stderr_scp = genesis.scp_from_remote(
                            f"{layer_src}/", layer_dest, recursive=True, timeout=120
                        )
                        if rc_scp == 0:
                            yield f"data: {_json_event('progress', f'Copied layer {layer}')}\n\n"
                            copied_count += 1
                        else:
                            yield f"data: {_json_event('progress', f'Failed to copy layer {layer}: {stderr_scp[:200]}')}\n\n"
                    else:
                        yield f"data: {_json_event('progress', f'Layer {layer} not found on Genesis server')}\n\n"

                yield f"data: {_json_event('progress', f'Copied {copied_count}/{len(req.layers)} layers to {dest_dir}')}\n\n"
            else:
                yield f"data: {_json_event('progress', 'No output destination configured')}\n\n"

            # Step 7: Cleanup
            yield f"data: {_json_event('progress', 'Cleaning up...')}\n\n"
            genesis._run_command(f"dbutil delete {job}")
            genesis._run_command(f"rm -rf {jobs_dir}/{job}")

            yield f"data: {_json_event('complete', f'Output complete for {job} → {machine} ({output_type})')}\n\n"

        except Exception as e:
            logger.error(f"Output error: {e}")
            yield f"data: {_json_event('error', str(e))}\n\n"

    return StreamingResponse(
        generate_progress(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


# ---- Configuration ----

@app.get("/api/config")
async def get_config():
    """Get all LDI configuration."""
    return config.get_all()

@app.post("/api/config")
async def update_config(req: ConfigUpdateRequest):
    """Update a configuration value."""
    config.set(req.key, req.value)
    return {"success": True, "key": req.key}

@app.get("/api/config/special-jobs")
async def get_special_jobs():
    """Get special job revision overrides."""
    return config.get_special_job_revisions()

@app.post("/api/config/special-jobs")
async def update_special_job(req: SpecialRevisionUpdate):
    """Add or update a special job revision override."""
    revisions = config.get_special_job_revisions()
    revisions[req.job] = {
        "prompt": req.prompt,
        "options": req.options,
    }
    config.set("special_job_revisions", revisions)
    return {"success": True, "job": req.job}

@app.delete("/api/config/special-jobs/{job}")
async def delete_special_job(job: str):
    """Remove a special job revision override."""
    revisions = config.get_special_job_revisions()
    if job in revisions:
        del revisions[job]
        config.set("special_job_revisions", revisions)
    return {"success": True}


# ---- Status ----

@app.get("/api/status")
async def get_status():
    """Check connectivity to Genesis system."""
    try:
        rc, stdout, stderr = genesis._run_command("echo ok", timeout=10)
        genesis_ok = rc == 0 and "ok" in stdout
    except Exception:
        genesis_ok = False

    return {
        "genesis_connected": genesis_ok,
        "genesis_host": genesis.remote_host or "local",
        "config_loaded": bool(config.get_all()),
        "timestamp": datetime.now().isoformat(),
    }


# ---- Helpers ----

import json

def _json_event(event_type: str, message: str) -> str:
    return json.dumps({"type": event_type, "message": message, "timestamp": datetime.now().isoformat()})


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("LDI_PORT", "8100"))
    uvicorn.run(app, host="0.0.0.0", port=port)

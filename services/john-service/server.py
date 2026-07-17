"""
John the Ripper wrapper service — zip password recovery.

Flow:
  POST /crack   (multipart 'file')  -> {jobId}
  GET  /stream/{jobId}  (SSE)       -> live log lines + result
  POST /abort/{jobId}               -> stop the run
  GET  /result/{jobId}              -> final status/password

Runs zip2john to extract the hash, then `john --incremental` (default modes).
Admin-only exposure is enforced upstream by frontend2.0; an optional shared
token (JOHN_API_TOKEN) adds a second guard between the app and this service.
"""
import os
import re
import queue
import shutil
import string
import tempfile
import threading
import subprocess
import time
import uuid

from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Request
from fastapi.responses import StreamingResponse, JSONResponse

JOHN = shutil.which("john") or "/opt/john/run/john"
ZIP2JOHN = shutil.which("zip2john") or "/opt/john/run/zip2john"
API_TOKEN = os.environ.get("JOHN_API_TOKEN", "")  # optional shared secret

app = FastAPI(title="John Zip Recovery")

# jobId -> job dict
JOBS: dict[str, dict] = {}


def _auth(token: str | None):
    if API_TOKEN and token != API_TOKEN:
        raise HTTPException(status_code=401, detail="Bad token")


def _safe_session(job_id: str) -> str:
    return "job_" + re.sub(r"[^a-zA-Z0-9_]", "", job_id)[:32]


def _push(job: dict, line: str):
    job["q"].put(line)


def _run(job: dict):
    """Background worker: extract hash, run john, poll status, report result."""
    workdir = job["workdir"]
    zip_path = job["zip_path"]
    hash_path = os.path.join(workdir, "hash.txt")
    pot_path = os.path.join(workdir, "john.pot")
    session = _safe_session(job["id"])

    try:
        # 1) Extract hash with zip2john
        _push(job, "Extracting hash with zip2john…")
        with open(hash_path, "w") as hf:
            z = subprocess.run([ZIP2JOHN, zip_path], stdout=hf,
                               stderr=subprocess.PIPE, text=True)
        if z.stderr:
            for ln in z.stderr.strip().splitlines():
                _push(job, "zip2john: " + ln)
        if not os.path.exists(hash_path) or os.path.getsize(hash_path) == 0:
            job["status"] = "error"
            _push(job, "ERROR: zip2john produced no hash. Is this an encrypted zip?")
            return

        # 2) Start john (incremental / default modes)
        _push(job, "Starting John the Ripper (incremental mode)…")
        cmd = [JOHN, "--incremental", f"--session={session}",
               f"--pot={pot_path}", hash_path]
        proc = subprocess.Popen(cmd, cwd=workdir, stdout=subprocess.PIPE,
                                stderr=subprocess.STDOUT, text=True, bufsize=1)
        job["proc"] = proc

        # Reader thread for john's own output (prints cracked pw + summaries)
        def reader():
            for line in proc.stdout:
                line = line.rstrip("\n")
                if line:
                    _push(job, line)
        t = threading.Thread(target=reader, daemon=True)
        t.start()

        # Poll `john --status` every few seconds for progress
        while proc.poll() is None:
            time.sleep(5)
            if job.get("abort"):
                break
            try:
                st = subprocess.run([JOHN, f"--status={session}"],
                                    cwd=workdir, capture_output=True, text=True, timeout=15)
                out = (st.stdout or st.stderr or "").strip()
                if out:
                    _push(job, "status: " + out.splitlines()[0])
            except Exception:
                pass

        if job.get("abort"):
            try:
                proc.terminate()
            except Exception:
                pass
            job["status"] = "aborted"
            _push(job, "Run aborted by user.")
            return

        proc.wait()
        t.join(timeout=3)

        # 3) Reveal any cracked password
        show = subprocess.run([JOHN, f"--pot={pot_path}", "--show", hash_path],
                              cwd=workdir, capture_output=True, text=True)
        password = None
        for line in show.stdout.splitlines():
            # zip2john lines look like  name:password:...  (name may be empty)
            if ":" in line and "password hash" not in line and "0 password" not in line:
                parts = line.split(":")
                if len(parts) >= 2 and parts[1] != "":
                    password = parts[1]
                    break
        if password:
            job["status"] = "found"
            job["password"] = password
            _push(job, f"PASSWORD FOUND: {password}")
        else:
            job["status"] = "exhausted"
            _push(job, "John finished without finding a password (keyspace exhausted or interrupted).")
    except Exception as e:
        job["status"] = "error"
        _push(job, f"ERROR: {e}")
    finally:
        _push(job, "__END__")


@app.post("/crack")
async def crack(file: UploadFile = File(...), x_api_token: str | None = Header(default=None)):
    _auth(x_api_token)
    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Please upload a .zip file")

    job_id = uuid.uuid4().hex
    workdir = tempfile.mkdtemp(prefix="john_")
    zip_path = os.path.join(workdir, "archive.zip")
    with open(zip_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    job = {
        "id": job_id, "workdir": workdir, "zip_path": zip_path,
        "q": queue.Queue(), "status": "running", "password": None,
        "proc": None, "abort": False, "filename": file.filename,
    }
    JOBS[job_id] = job
    threading.Thread(target=_run, args=(job,), daemon=True).start()
    return {"jobId": job_id, "filename": file.filename}


@app.get("/stream/{job_id}")
def stream(job_id: str, request: Request):
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="No such job")

    def gen():
        yield "retry: 3000\n\n"
        while True:
            try:
                line = job["q"].get(timeout=10)
            except queue.Empty:
                yield ": keep-alive\n\n"
                continue
            if line == "__END__":
                yield f"event: done\ndata: {job['status']}\n\n"
                break
            # escape newlines for SSE safety
            safe = line.replace("\r", " ")
            yield f"data: {safe}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.post("/abort/{job_id}")
def abort(job_id: str, x_api_token: str | None = Header(default=None)):
    _auth(x_api_token)
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="No such job")
    job["abort"] = True
    p = job.get("proc")
    if p and p.poll() is None:
        try:
            p.terminate()
        except Exception:
            pass
    return {"ok": True}


@app.get("/result/{job_id}")
def result(job_id: str, x_api_token: str | None = Header(default=None)):
    _auth(x_api_token)
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="No such job")
    return {"status": job["status"], "password": job.get("password"),
            "filename": job.get("filename")}


@app.get("/health")
def health():
    return {"ok": True, "john": JOHN, "zip2john": ZIP2JOHN}

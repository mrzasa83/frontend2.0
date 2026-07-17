# John Zip Recovery service

A standalone container that runs John the Ripper (jumbo) to recover the password
of an **encrypted zip you own**. Called by frontend2.0's admin-only
"Zip Password Recovery" app.

## Build & run

```bash
cd services/john-service
docker build -t john-zip-recovery .

docker run -d --name john-zip-recovery \
  -p 8081:8080 \
  -e JOHN_API_TOKEN=change-me-long-random \
  john-zip-recovery
```

The John jumbo build clones from github.com during the image build. If your
network re-signs TLS with an internal CA, add the CA into the build (same
pattern as the fleet remediation) or build where github.com is reachable.

## Wire it to frontend2.0

Set these on the frontend2.0 container (deploy.sh APP_ENV):

```
JOHN_SERVICE_URL=http://john-zip-recovery:8080     # or http://<host>:8081
JOHN_API_TOKEN=change-me-long-random               # must match the service
```

If both containers share a docker network, use the service name; otherwise use
the host + published port.

## Endpoints (internal)

- `POST /crack`   multipart `file` → `{ jobId }`
- `GET  /stream/{jobId}` Server-Sent Events (live log + `event: done`)
- `POST /abort/{jobId}`
- `GET  /result/{jobId}`
- `GET  /health`

## Notes

- Uses `zip2john` then `john --incremental` (default modes). Incremental can run
  a long time on strong passwords — the app has an Abort button.
- CPU-heavy. Give the container cores; consider `--cpus` limits so it doesn't
  starve other services.
- For authorized recovery of files you own only.

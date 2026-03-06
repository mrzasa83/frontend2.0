# frontEnd 2.0

Internal manufacturing application — product management, work orders, audits and file serving from network drives.

## Local Development

```bash
cp .env.example .env.local   # edit with your DB credentials
npm install
npm run dev                   # http://localhost:4221
```

## Docker / Production

### 1. Build

```bash
docker compose build
```

### 2. Configure

Edit `docker-compose.yml` and set:

- **`NEXTAUTH_URL`** — Must include the basePath: `http://your-host/frontend2.0`
- **`NEXTAUTH_SECRET`** — Generate with `openssl rand -base64 32`
- **Database credentials** — MySQL primary, MySQL secondary (Paradigm), SQL Server
- **Volume mounts** — Network drives (J:, S:, T:) must be mounted on the Docker host

### 3. Run

```bash
docker compose up -d
```

### 4. nginx

Copy `nginx-frontend2.conf` to `/etc/nginx/conf.d/` and reload nginx. The config proxies `/frontend2.0/*` to the container.

## Network Drive Mounts

The app serves files from three network drives that must be mounted on the Docker host:

| Windows | Default Linux Mount | Env Override    |
|---------|-------------------|-----------------|
| `J:\`   | `/mnt/jdrive`     | `DRIVE_MOUNT_J` |
| `S:\`   | `/mnt/sdrive`     | `DRIVE_MOUNT_S` |
| `T:\`   | `/mnt/tdrive`     | `DRIVE_MOUNT_T` |

The UNC server mapping (`\\APCFS04\SHARED2` → S: drive) is configurable via `UNC_SERVER_NAME` and `UNC_SHARE_NAME`.

Mount configuration is centralized in `lib/config/drives.ts`.

## Key Architecture Notes

- **basePath**: The Docker build uses `basePath: '/frontend2.0'` in `next.config.docker.js`. The local dev config has no basePath.
- **Middleware**: Authentication middleware lives at the **project root** (`middleware.ts`), not inside `app/`.
- **API calls**: Client components use `getApiUrl()` from `lib/api.ts` which prepends `NEXT_PUBLIC_BASE_PATH` to fetch URLs.
- **SessionProvider**: Configured in `app/providers.tsx` with the correct basePath for NextAuth client calls.

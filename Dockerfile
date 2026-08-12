# ---- Stage 1: Install dependencies ----
FROM node:20-slim AS deps
WORKDIR /app
# Copy package.json and the lock file. The committed lock is authoritative and
# in-sync, so prefer `npm ci` (exact, reproducible, matches the lock). Fall back
# to a clean `npm install` if the lock is ever missing/out-of-sync, first wiping
# any partial node_modules so we never build on an inconsistent tree.
COPY package*.json ./
RUN npm ci --no-audit --no-fund \
  || (echo "npm ci failed — falling back to clean npm install" \
      && rm -rf node_modules \
      && npm install --no-audit --no-fund)

# ---- Stage 2: Build ----
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Safety net: remove any stray Tailwind v3-era configs that would shadow the
# correct postcss.config.mjs and break the v4 build. .dockerignore should keep
# them out of the context, but this guarantees a clean v4 setup regardless.
RUN rm -f postcss.config.js postcss.config.cjs tailwind.config.js tailwind.config.ts

# Swap in Docker-specific next.config (adds basePath + standalone)
RUN cp next.config.docker.js next.config.js

# Ensure public dir exists (git may not track empty dirs)
RUN mkdir -p public

# NEXT_PUBLIC_ vars must exist at build time to be baked into client bundle
ENV NEXT_PUBLIC_BASE_PATH=/frontend2.0
ARG APP_VERSION=unknown
ENV NEXT_PUBLIC_APP_VERSION=${APP_VERSION}

RUN npm run build

# ---- Stage 3: Production ----
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# LibreOffice (headless) for Office->PDF preview conversion (doc/ppt/pptx/etc.)
# --no-install-recommends keeps the image lean; fonts-liberation gives sane fonts.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       libreoffice-writer libreoffice-impress libreoffice-calc \
       fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Ensure all app files are readable by any user (container may run as non-root)
RUN chmod -R 755 /app

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# =====================================================================
# Required runtime env vars (set via docker-compose.yml or docker run):
# =====================================================================
#   NEXTAUTH_URL        = http://your-host/frontend2.0   ← MUST include basePath!
#   NEXTAUTH_SECRET     = <random-secret>
#   DB_MYSQL_PRIMARY_HOST / _PORT / _USER / _PASSWORD / _DATABASE
#   DB_MYSQL_SECONDARY_HOST / ... (Paradigm read replica)
#   DB_MSSQL_HOST / ... (SQL Server)
#
# Optional drive-mount overrides (defaults match typical volume mounts):
#   DRIVE_MOUNT_J = /mnt/jdrive
#   DRIVE_MOUNT_S = /mnt/sdrive
#   DRIVE_MOUNT_T = /mnt/tdrive
#   UNC_SERVER_NAME = APCFS04
#   UNC_SHARE_NAME  = SHARED2

CMD ["node", "server.js"]

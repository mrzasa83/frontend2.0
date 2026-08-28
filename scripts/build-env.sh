#!/usr/bin/env bash
# =============================================================================
# build-env.sh — work out WHICH system this is and WHAT code is being built,
# then export it so docker compose can bake it into the image.
#
# Source this from deploy.sh, before `docker compose build`:
#
#     source ./scripts/build-env.sh
#     docker compose build --no-cache
#     docker compose up -d
#
# Why bake rather than read at runtime: the image has no .git directory, and a
# value read from a mounted file could be changed under a running container —
# so a DEV box could quietly claim to be PROD. Baking makes the answer a
# property of the image.
# =============================================================================

set -euo pipefail

# ── Which system ─────────────────────────────────────────────────────────────
# Precedence: an already-exported APP_ENV wins, then .env.local, then PROD.
# Keeping it in .env.local means the dev host and the prod host each carry their
# own answer and nobody has to remember a flag.
if [[ -z "${APP_ENV:-}" ]] && [[ -f .env.local ]]; then
  APP_ENV="$(grep -E '^\s*APP_ENV\s*=' .env.local | tail -1 | cut -d= -f2- | tr -d ' "'\''' || true)"
fi
APP_ENV="${APP_ENV:-PROD}"
APP_ENV="$(echo "$APP_ENV" | tr '[:lower:]' '[:upper:]')"

case "$APP_ENV" in
  DEV|PROD) ;;
  *)
    echo "build-env: APP_ENV='$APP_ENV' is not DEV or PROD — defaulting to PROD" >&2
    APP_ENV=PROD
    ;;
esac

# ── What code ────────────────────────────────────────────────────────────────
if git rev-parse --git-dir >/dev/null 2>&1; then
  GIT_SHA="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
  # Prefer the UPSTREAM branch name over the local one. `git reset --hard
  # origin/main` leaves content from main while the local HEAD may still be
  # called master, and reporting the local name would be simply wrong about
  # what's deployed.
  GIT_BRANCH="$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null | sed 's#^[^/]*/##' || true)"
  if [[ -z "$GIT_BRANCH" || "$GIT_BRANCH" == "@{u}" ]]; then
    GIT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
  fi
  # --dirty appends "-dirty" when the working tree has uncommitted changes,
  # which the footer shows in red. Deploying a dirty tree isn't forbidden, but
  # it should be visible.
  GIT_DESCRIBE="$(git describe --tags --always --dirty 2>/dev/null || echo '')"
else
  GIT_SHA=unknown
  GIT_BRANCH=unknown
  GIT_DESCRIBE=''
  echo "build-env: not a git checkout — provenance will show as unknown" >&2
fi

BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# APP_VERSION: prefer a real tag, else keep whatever compose defaults to.
if [[ -z "${APP_VERSION:-}" ]]; then
  TAG="$(git describe --tags --abbrev=0 2>/dev/null || echo '')"
  APP_VERSION="${TAG:-2.4.0}"
fi

export APP_ENV GIT_SHA GIT_BRANCH GIT_DESCRIBE BUILD_TIME APP_VERSION

echo "──────────────────────────────────────────────"
echo " Building : $APP_ENV"
echo " Version  : $APP_VERSION"
echo " Commit   : ${GIT_SHA:0:7} (${GIT_BRANCH})"
echo " Describe : ${GIT_DESCRIBE:-n/a}"
echo " Built at : $BUILD_TIME"
echo "──────────────────────────────────────────────"

# A dirty tree going to production is worth a deliberate pause.
if [[ "$APP_ENV" == "PROD" && "$GIT_DESCRIBE" == *-dirty ]]; then
  echo "WARNING: building PROD from a working tree with uncommitted changes." >&2
  echo "         The footer will flag this build as 'uncommitted'." >&2
fi

#!/usr/bin/env bash
# deploy-vps.sh — runs ON the VPS server after `git reset --hard origin/main`
# Called by GitHub Actions: ssh ... "bash scripts/deploy-vps.sh"
set -euo pipefail

echo "=== deploy-vps.sh started at $(date -u +%T) UTC ==="
echo "  working dir: $(pwd)"
echo "  git commit:  $(git rev-parse --short=12 HEAD)"
git log -1 --pretty='format:  %h %s (%ci)'
echo ""

# ── 0. Verify docker is accessible ──────────────────────────────────────────
docker info > /dev/null 2>&1 || { echo "::error::docker is not accessible for user $(whoami)"; exit 1; }
docker compose version || { echo "::error::docker compose not found"; exit 1; }

# ── 1. Normalise DATABASE_URL host ───────────────────────────────────────────
if [ ! -s backend/.env ]; then
  echo "::error::backend/.env is missing or empty on VPS"
  exit 1
fi

db_url="$(grep '^DATABASE_URL=' backend/.env | head -n1 | cut -d= -f2- | tr -d '\r')"
if [ -z "$db_url" ]; then
  echo "::error::DATABASE_URL is missing in backend/.env"
  exit 1
fi

normalized_db_url="$(echo "$db_url" | sed -E 's#(://[^@]+@)(localhost|127\.0\.0\.1)(:[0-9]+)?/#\1postgres:5432/#')"
if [ "$normalized_db_url" != "$db_url" ]; then
  awk -v value="$normalized_db_url" 'BEGIN{done=0} /^DATABASE_URL=/{print "DATABASE_URL=" value; done=1; next} {print} END{if(!done) print "DATABASE_URL=" value}' backend/.env > backend/.env.tmp
  mv backend/.env.tmp backend/.env
  db_url="$normalized_db_url"
  echo "DATABASE_URL normalised: localhost -> postgres:5432"
fi

# ── 2. Parse DB credentials ───────────────────────────────────────────────────
db_url_body="${db_url#*://}"
db_creds_host="${db_url_body%%/*}"
db_name_raw="${db_url_body#*/}"; db_name_raw="${db_name_raw%%\?*}"
db_creds_raw="${db_creds_host%@*}"
db_user_raw="${db_creds_raw%%:*}"
db_pass_raw="${db_creds_raw#*:}"
[ "$db_user_raw" = "$db_creds_raw" ] && db_pass_raw=""

url_decode() { local d="${1//+/ }"; printf '%b' "${d//%/\\x}"; }
db_user="$(url_decode "$db_user_raw")"
db_pass="$(url_decode "$db_pass_raw")"
db_name="$(url_decode "$db_name_raw")"

if [ -z "$db_user" ] || [ -z "$db_pass" ] || [ -z "$db_name" ]; then
  echo "::error::Could not parse DB credentials from DATABASE_URL"
  exit 1
fi
export POSTGRES_USER="$db_user" POSTGRES_PASSWORD="$db_pass" POSTGRES_DB="$db_name"

# ── 3. Start postgres + sync role password ────────────────────────────────────
echo "--- Starting postgres..."
docker compose -f docker-compose.prod.yml up -d postgres
echo "--- Syncing DB role password..."
db_user_sql="$(printf '%s' "$db_user" | sed 's/"/""/g')"
db_pass_sql="$(printf '%s' "$db_pass" | sed "s/'/''/g")"
docker compose -f docker-compose.prod.yml exec -T postgres \
  sh -c "psql -U \"$POSTGRES_USER\" -d \"$POSTGRES_DB\" -v ON_ERROR_STOP=1 -c \"ALTER ROLE \\\"$db_user_sql\\\" WITH LOGIN PASSWORD '$db_pass_sql';\"" \
  || { echo "::warning::ALTER ROLE failed (might be first deploy)"; }

# ── 4. Wipe old images (all known naming variants) ────────────────────────────
echo "--- Removing old frontend/backend images..."
docker rmi repeto-frontend repeto-backend app-frontend app-backend 2>/dev/null || true
docker builder prune -f --filter type=exec.cachemount 2>/dev/null || true

# ── 5. Build from scratch (no cache) ─────────────────────────────────────────
echo "--- Building images with --no-cache at $(date -u +%T) UTC..."
if ! docker compose -f docker-compose.prod.yml build --no-cache frontend backend 2>&1; then
  echo "::error::docker compose build failed"
  docker compose -f docker-compose.prod.yml ps || true
  exit 1
fi
echo "--- Build done at $(date -u +%T) UTC"

# ── 6. Bring up services ──────────────────────────────────────────────────────
echo "--- Launching services..."
if ! docker compose -f docker-compose.prod.yml up -d --force-recreate backend frontend nginx --remove-orphans; then
  echo "::error::docker compose up failed"
  docker compose -f docker-compose.prod.yml ps || true
  docker compose -f docker-compose.prod.yml logs --no-color --tail=100 backend frontend nginx || true
  exit 1
fi

# ── 7. Verify containers were recreated after deploy started ──────────────────
deploy_started_epoch="${DEPLOY_STARTED_EPOCH:-0}"
backend_cid="$(docker compose -f docker-compose.prod.yml ps -q backend || true)"
frontend_cid="$(docker compose -f docker-compose.prod.yml ps -q frontend || true)"

if [ -z "$backend_cid" ] || [ -z "$frontend_cid" ]; then
  echo "::error::Cannot find backend/frontend containers after deploy"
  docker compose -f docker-compose.prod.yml ps || true
  exit 1
fi

backend_started="$(docker inspect -f '{{.State.StartedAt}}' "$backend_cid" 2>/dev/null || echo 0)"
frontend_started="$(docker inspect -f '{{.State.StartedAt}}' "$frontend_cid" 2>/dev/null || echo 0)"
backend_epoch="$(date -u -d "$backend_started" +%s 2>/dev/null || echo 0)"
frontend_epoch="$(date -u -d "$frontend_started" +%s 2>/dev/null || echo 0)"

echo "Container start check: backend=$backend_started frontend=$frontend_started deploy_started=$deploy_started_epoch"
if [ "$backend_epoch" -lt "$deploy_started_epoch" ] || [ "$frontend_epoch" -lt "$deploy_started_epoch" ]; then
  echo "::error::Containers were NOT recreated during this deploy"
  docker compose -f docker-compose.prod.yml ps || true
  exit 1
fi

# ── 8. Nginx reload + print new BUILD_ID ─────────────────────────────────────
docker compose -f docker-compose.prod.yml exec -T nginx nginx -t
docker compose -f docker-compose.prod.yml exec -T nginx nginx -s reload
new_build_id="$(docker exec "$frontend_cid" sh -c 'cat /app/.next/BUILD_ID 2>/dev/null || echo n/a')"
echo "=== deploy-vps.sh SUCCESS — new BUILD_ID: $new_build_id at $(date -u +%T) UTC ==="
docker compose -f docker-compose.prod.yml ps

# ── 9. Wait for backend to become healthy ─────────────────────────────────────
echo "--- Waiting for backend to become healthy..."
healthy="false"
for attempt in $(seq 1 36); do
  backend_cid="$(docker compose -f docker-compose.prod.yml ps -q backend 2>/dev/null || true)"
  if [ -n "$backend_cid" ]; then
    health_status="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$backend_cid" 2>/dev/null || true)"
    echo "  attempt $attempt/36: health=$health_status"
    if [ "$health_status" = "healthy" ]; then
      healthy="true"
      break
    fi
  fi
  sleep 5
done

if [ "$healthy" != "true" ]; then
  echo "::error::Backend did not become healthy within 3 minutes"
  docker compose -f docker-compose.prod.yml ps
  docker compose -f docker-compose.prod.yml logs --no-color --tail=200 backend || true
  docker compose -f docker-compose.prod.yml logs --no-color --tail=100 postgres || true
  exit 1
fi
echo "--- Backend is healthy at $(date -u +%T) UTC"

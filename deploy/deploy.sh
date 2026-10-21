#!/usr/bin/env bash
# Pull and (re)start the frontend container. Run on the VM from /srv/hwanscord/frontend.
#   APP_TAG=<tag> ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

export APP_TAG="${APP_TAG:-latest}"
echo "== hwanscord-frontend deploy tag=${APP_TAG}"

# shared network with the backend stack (idempotent)
docker network inspect hwanscord >/dev/null 2>&1 || docker network create hwanscord >/dev/null

docker compose pull
docker compose up -d --remove-orphans

for i in $(seq 1 30); do
  status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' hwanscord-web 2>/dev/null || true)"
  if [ "$status" = "healthy" ] || [ "$status" = "running" ]; then
    echo "== hwanscord-web is $status"
    break
  fi
  sleep 2
done

docker image prune -f >/dev/null 2>&1 || true
docker compose ps

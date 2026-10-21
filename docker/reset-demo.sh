#!/bin/sh
# Restablece la demo en producción: vuelve a ejecutar la semilla dentro del
# contenedor de la API, que borra tablas y uploads y carga prisma/demo.
# Lo lanza el cron del servidor cada noche (ver DEPLOY.md, «Reset de la demo»).
#
# Sólo para producción: exige el .env.prod del clon del servidor, que en local
# no existe, así que en tu máquina no hace nada.
set -eu

# cron arranca con un PATH mínimo y desde $HOME.
PATH=/usr/local/bin:/usr/bin:/bin
cd "$(dirname "$0")/.."

stamp() { date '+%Y-%m-%d %H:%M:%S %Z'; }

if [ ! -f .env.prod ]; then
  echo "$(stamp) ✗ No hay .env.prod en $(pwd): este script sólo se ejecuta en el servidor de producción." >&2
  exit 1
fi

compose() { docker compose -f docker-compose.prod.yml --env-file .env.prod "$@"; }

if [ -z "$(compose ps --status running -q api)" ]; then
  echo "$(stamp) ✗ El contenedor api no está en marcha; no se restablece la demo." >&2
  exit 1
fi

echo "$(stamp) → Restableciendo la demo…"
# -T: cron no tiene terminal.
compose exec -T api /app/node_modules/.bin/ts-node --transpile-only \
  -O '{"module":"commonjs","moduleResolution":"node"}' prisma/seed.ts
echo "$(stamp) ✓ Demo restablecida."

#!/bin/sh
# Aplica las migraciones pendientes antes de arrancar la API.
# `migrate deploy` es idempotente: si no hay nada pendiente, no toca nada.
# Se llama al binario local en vez de a `npx` para que no intente descargar
# nada de la red si la resolución falla.
set -e

echo "→ Aplicando migraciones de Prisma…"
/app/node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma

echo "→ Arrancando la API…"
exec "$@"

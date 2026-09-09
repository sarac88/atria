# Imagen de la API (NestJS + Prisma).
# El contexto de build es la raíz del monorepo, no esta carpeta:
#   docker build -f apps/api/Dockerfile .
#
# Debian slim en vez de Alpine a propósito: Prisma necesita OpenSSL de glibc y
# argon2 sólo publica binarios precompilados para glibc. En Alpine habría que
# compilar ambos a mano.

# ---------- builder ----------
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# openssl -> Prisma. python3/make/g++ -> red de seguridad por si argon2 no
# encuentra binario precompilado para esta arquitectura y toca compilarlo.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates openssl python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Primero sólo los manifiestos: npm ci valida el árbol completo del workspace
# contra el lockfile, y así esta capa se reaprovecha mientras no cambien.
COPY package.json package-lock.json ./
COPY packages/types/package.json packages/types/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci

# @atria/types es dependencia de la API, así que se compila antes.
COPY packages/types packages/types
RUN npm run build --workspace @atria/types

COPY apps/api apps/api
RUN npm run db:generate --workspace @atria/api
RUN npm run build --workspace @atria/api

# ---------- runtime ----------
FROM node:22-bookworm-slim AS runner

# process.cwd() decide dónde busca la API la carpeta uploads (common/uploads.ts),
# así que el WORKDIR tiene que ser la carpeta de la app, no la raíz.
WORKDIR /app/apps/api
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

# node_modules se copia entero, sin podar: ahí viven el cliente de Prisma ya
# generado, el binario nativo de argon2 y el CLI de prisma que usa el
# entrypoint para aplicar migraciones.
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/packages/types /app/packages/types
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma

COPY docker/api-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Punto de montaje del volumen de ficheros subidos.
RUN mkdir -p uploads && chown -R node:node /app/apps/api
USER node

EXPOSE 3001
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "dist/main.js"]

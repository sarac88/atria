# Imagen del frontend (Next.js 14).
# El contexto de build es la raíz del monorepo, no esta carpeta:
#   docker build -f apps/web/Dockerfile .
#
# Nota: no se usa `output: "standalone"`. Requeriría tocar next.config.mjs y
# ajustar outputFileTracingRoot para el monorepo; a cambio sólo se ahorra
# tamaño de imagen, que en un EBS de 20 GB da igual.

# ---------- builder ----------
FROM node:22-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY packages/types/package.json packages/types/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci

COPY packages/types packages/types
RUN npm run build --workspace @atria/types

COPY apps/web apps/web

# IMPORTANTE: NEXT_PUBLIC_* se hornea en el bundle durante el build, no se lee
# en runtime. Tiene que ser ya la URL pública definitiva; cambiarla obliga a
# reconstruir la imagen.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN test -n "$NEXT_PUBLIC_API_URL" \
    || (echo "ERROR: falta NEXT_PUBLIC_API_URL en el build de web" && exit 1)

# El prebuild copia el worker de pdf.js a public/.
RUN npm run build --workspace @atria/web

# ---------- runtime ----------
FROM node:22-bookworm-slim AS runner
WORKDIR /app/apps/web
ENV NODE_ENV=production

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/packages/types /app/packages/types
COPY --from=builder --chown=node:node /app/apps/web ./

USER node

EXPOSE 3000
# Se llama al binario directamente y con -H explícito: dentro del contenedor
# hay que escuchar en todas las interfaces para que Caddy pueda alcanzarlo.
CMD ["/app/node_modules/.bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]

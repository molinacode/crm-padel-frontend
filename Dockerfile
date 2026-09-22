# syntax=docker/dockerfile:1
# Coolify clona molinacode/crm-padel-frontend. Contexto: raíz del repo.
# Puerto del contenedor: 3000. Traefik en Coolify; sin publicar 5432.

FROM node:22-alpine AS web
WORKDIR /web
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . ./
RUN pnpm build

FROM node:22-alpine AS api
WORKDIR /api
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev
COPY backend/ ./

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV FOTOS_DIR=/data/fotos-alumnos
ENV PUBLIC_DIR=/app/public

RUN addgroup -S crm && adduser -S crm -G crm \
  && mkdir -p /data/fotos-alumnos /app/public \
  && chown -R crm:crm /data /app

COPY --from=api --chown=crm:crm /api /app
COPY --from=web --chown=crm:crm /web/dist /app/public

USER crm
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]

# syntax=docker/dockerfile:1.7

# -----------------------------
# Build Stage
# -----------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Build benötigt devDependencies + git
ENV NODE_ENV=development

# System dependencies
RUN apk add --no-cache git

# Install dependencies (cached layer). pnpm is pinned to the `packageManager` version in
# package.json (single source of truth): an unpinned `npm install -g pnpm` picked up pnpm 12, which
# tries to switch itself to that exact version via a native @pnpm/exe binary that doesn't exist for
# Alpine (musl) → ERR_PNPM_PNPM_ENGINE_NO_NATIVE_BINARY.
COPY package.json pnpm-lock.yaml ./
RUN npm install -g "pnpm@$(node -p "require('./package.json').packageManager.split('@')[1].split('+')[0]")" \
 && pnpm install

# Copy source
COPY . .

# Release channel (prod/dev) — CI passes this based on the branch; defaults to dev.
# Consumed by webpack/shared.config.js to set ZOCIAL_CHANNEL.
ARG ZOCIAL_CHANNEL=dev
ENV ZOCIAL_CHANNEL=$ZOCIAL_CHANNEL

RUN pnpm run build \
 && cp __sapper__/export/service-worker-index.html __sapper__/export/404.html

# -----------------------------
# Runtime Stage
# -----------------------------
# stable-alpine rather than a pinned minor: this image faces the internet, and the CI rebuilds it on
# every push, so nginx/Alpine security fixes arrive with the next build (1.27 no longer gets any).
FROM nginx:stable-alpine

# Copy nginx config and entrypoint
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf.template
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy built app
COPY --from=build /app/__sapper__/export /usr/share/nginx/html

# Expose port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

# Replace placeholder at startup, then hand off to nginx
ENTRYPOINT ["/entrypoint.sh"]

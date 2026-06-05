# syntax=docker/dockerfile:1.7

# -----------------------------
# Build Stage
# -----------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Build benötigt devDependencies + git
ENV NODE_ENV=development

# System dependencies + pnpm
RUN apk add --no-cache git \
 && npm install -g pnpm

# Install dependencies (cached layer)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

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
FROM nginx:1.27-alpine

# Copy nginx config and entrypoint
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
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

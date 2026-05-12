# syntax=docker/dockerfile:1.7

# -----------------------------
# Build Stage
# -----------------------------
FROM node:20-alpine AS build

WORKDIR /app

# IMPORTANT:
# Build braucht devDependencies + git
ENV NODE_ENV=development

# Install required system deps
RUN apk add --no-cache git \
 && npm install -g pnpm

# Install dependencies (cached layer)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Copy rest of the app
COPY . .

# Build + export
RUN pnpm run build \
 && cp __sapper__/export/service-worker-index.html __sapper__/export/404.html

# -----------------------------
# Runtime Stage
# -----------------------------
FROM nginx:1.27-alpine

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy static build output
COPY --from=build /app/__sapper__/export /usr/share/nginx/html

# Expose HTTP
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

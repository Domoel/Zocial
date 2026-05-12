# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS build
WORKDIR /app

ENV NODE_ENV=development

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .
RUN pnpm run build \
    && cp __sapper__/export/service-worker-index.html __sapper__/export/404.html

FROM nginx:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/__sapper__/export /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

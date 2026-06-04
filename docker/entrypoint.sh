#!/bin/sh
set -e

# Generate runtime config so SINGLE_INSTANCE can be set via docker-compose
# without rebuilding the image. The JS reads window.__ZOCIAL_SINGLE_INSTANCE__
# at runtime, bypassing webpack/terser build-time optimization.
INSTANCE="${SINGLE_INSTANCE:-}"
printf 'window.__ZOCIAL_SINGLE_INSTANCE__=%s;\n' "\"${INSTANCE}\"" \
  > /usr/share/nginx/html/config.js

exec nginx -g "daemon off;"

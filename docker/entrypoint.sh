#!/bin/sh
set -e

# Generate runtime config so SINGLE_INSTANCE can be set via docker-compose
# without rebuilding the image. The JS reads window.__ZOCIAL_SINGLE_INSTANCE__
# at runtime, bypassing webpack/terser build-time optimization.
INSTANCE="${SINGLE_INSTANCE:-}"
printf 'window.__ZOCIAL_SINGLE_INSTANCE__=%s;\n' "\"${INSTANCE}\"" \
  > /usr/share/nginx/html/config.js

# Generate nginx config from template, substituting the translation API base URL.
# TRANSLATE_API must be the base URL of a LibreTranslate-compatible instance
# (e.g. https://libretranslate.com). Defaults to the public libretranslate.com instance.
TRANSLATE_API="${TRANSLATE_API:-https://libretranslate.com}"
TRANSLATE_API="${TRANSLATE_API%/}"
sed "s|__TRANSLATE_API__|${TRANSLATE_API}|g" \
  /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g "daemon off;"

#!/bin/sh
set -e

# Generate runtime config so SINGLE_INSTANCE can be set via docker-compose
# without rebuilding the image. The JS reads window.__ZOCIAL_SINGLE_INSTANCE__
# at runtime, bypassing webpack/terser build-time optimization.
INSTANCE="${SINGLE_INSTANCE:-}"
# The value lands inside a JS string literal: refuse characters that would break out of it (or the
# config silently stops working) instead of writing a broken config.js.
case "$INSTANCE" in
  *[\"\\\<\>\;]*|*"
"*)
    echo "entrypoint: SINGLE_INSTANCE contains characters that aren't allowed in a host name: $INSTANCE" >&2
    exit 1 ;;
esac
printf 'window.__ZOCIAL_SINGLE_INSTANCE__=%s;\n' "\"${INSTANCE}\"" \
  > /usr/share/nginx/html/config.js

# Generate nginx config from template, substituting the translation API base URL.
# TRANSLATE_API must be the base URL of a LibreTranslate-compatible instance.
# Defaults to the Zocial-operated instance; override in .env for self-hosted deployments.
TRANSLATE_API="${TRANSLATE_API:-https://translate.zocial.social}"
TRANSLATE_API="${TRANSLATE_API%/}"
# Substituted into nginx.conf via sed (| is the sed delimiter, " and ; end the nginx value).
case "$TRANSLATE_API" in
  http://*|https://*) ;;
  *)
    echo "entrypoint: TRANSLATE_API must start with http:// or https://, got: $TRANSLATE_API" >&2
    exit 1 ;;
esac
case "$TRANSLATE_API" in
  *[\|\"\;\ \$\{\}\\]*|*"
"*)
    echo "entrypoint: TRANSLATE_API contains characters that aren't allowed in a URL: $TRANSLATE_API" >&2
    exit 1 ;;
esac
sed "s|__TRANSLATE_API__|${TRANSLATE_API}|g" \
  /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g "daemon off;"

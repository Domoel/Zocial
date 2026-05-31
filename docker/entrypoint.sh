#!/bin/sh
set -e

# Replace the build-time placeholder with the runtime SINGLE_INSTANCE value.
# Empty or unset = multi-instance mode (instance input field shown on login screen).
INSTANCE="${SINGLE_INSTANCE:-}"

find /usr/share/nginx/html -type f -name "*.js" \
  -exec sed -i "s|__ZOCIAL_INSTANCE__|${INSTANCE}|g" {} \;

exec nginx -g "daemon off;"

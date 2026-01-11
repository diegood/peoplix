#!/bin/sh
set -e

: ${API_HTTP_URL:=${VITE_API_HTTP_URL:-http://localhost:3000/graphql}}
: ${API_WS_URL:=${VITE_API_WS_URL:-ws://localhost:3000/graphql}}

cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = {
  API_HTTP_URL: "${API_HTTP_URL}",
  API_WS_URL: "${API_WS_URL}"
};
EOF
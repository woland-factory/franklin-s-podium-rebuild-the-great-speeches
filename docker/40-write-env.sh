#!/bin/sh
# Write the runtime config from the environment before nginx serves. Runs via
# the nginx image's /docker-entrypoint.d/ hook. Keeps the SPA static while
# honoring a deploy-time SEED_DEMO value.
set -e
: "${SEED_DEMO:=}"
cat > /usr/share/nginx/html/env.js <<EOF
window.__ENV__ = { SEED_DEMO: "${SEED_DEMO}" };
EOF
echo "wrote /env.js (SEED_DEMO=${SEED_DEMO})"

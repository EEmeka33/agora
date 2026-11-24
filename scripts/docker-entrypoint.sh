#!/bin/sh
# Prepares the data volume, then starts Agora.
set -e

mkdir -p /app/data/uploads

# Generate a session secret once and keep it in the volume (unless provided).
if [ -z "$AUTH_SECRET" ]; then
  if [ ! -f /app/data/.auth-secret ]; then
    node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))" > /app/data/.auth-secret
  fi
  AUTH_SECRET="$(cat /app/data/.auth-secret)"
  export AUTH_SECRET
fi

# Apply pending database migrations (safe to run on every start).
npx prisma migrate deploy

exec "$@"

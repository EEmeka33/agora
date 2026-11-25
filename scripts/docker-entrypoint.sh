#!/bin/sh
# Prepares the data volume, then starts Agora.
set -e

# Files created from now on are private to the container user.
umask 077
mkdir -p /app/data/uploads

# Apply pending database migrations (safe to run on every start).
npx prisma migrate deploy

exec "$@"

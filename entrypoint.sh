#!/bin/sh

set -e

echo "Running migrations..."
npx prisma migrate deploy

if [ "${RUN_SEED:-true}" = "true" ]; then
  echo "Seeding..."
  node dist/prisma/seed.js
else
  echo "Seeding skipped (RUN_SEED=false)"
fi

echo "Starting app..."
exec "$@"

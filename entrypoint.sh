#!/bin/sh

set -e

echo "Running migrations..."
./node_modules/.bin/prisma migrate deploy

if [ "${RUN_SEED:-true}" = "true" ]; then
  echo "Seeding..."
  node dist/prisma/seed.js
else
  echo "Seeding skipped (RUN_SEED=false)"
fi

echo "Starting app..."
exec "$@"

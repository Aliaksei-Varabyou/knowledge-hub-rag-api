#!/bin/sh

echo "Running migrations..."
npx prisma migrate deploy

echo "Seeding..."
npx prisma db seed

echo "Starting app..."
exec "$@"

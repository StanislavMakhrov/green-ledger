#!/bin/sh
set -e

echo "Running database migrations..."
node /app/node_modules/prisma/build/index.js migrate deploy

echo "Running database seed..."
node /app/node_modules/tsx/dist/cli.cjs /app/prisma/seed.ts || true

echo "Starting application server..."
exec node /app/server.js

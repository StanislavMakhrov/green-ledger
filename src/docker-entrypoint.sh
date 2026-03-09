#!/bin/sh
set -e

if [ ! -f /data/greenledger.db ]; then
  echo "Initializing database from template..."
  cp /app/greenledger.template.db /data/greenledger.db
fi

echo "Starting application server..."
exec node /app/server.js

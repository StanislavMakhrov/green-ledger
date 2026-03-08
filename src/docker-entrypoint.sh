#!/bin/sh
set -e

# Apply any pending Prisma migrations before starting the server
node node_modules/.bin/prisma migrate deploy

exec node server.js

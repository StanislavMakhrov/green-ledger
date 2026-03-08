# Stage 1: Install all dependencies (needed for build + Prisma code-gen)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Build the Next.js application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Provide a placeholder DB URL so Prisma client is satisfied at build time.
# The real DATABASE_URL is injected at runtime via environment variable.
ENV DATABASE_URL=file:/tmp/build-placeholder.db
RUN npm run build

# Stage 3: Production runtime image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user to run the app
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy the standalone Next.js server bundle
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy the public directory (static assets)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma schema and migrations so `prisma migrate deploy` works at startup
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy Prisma query engine and client from the build stage
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
# Copy the Prisma CLI so the entrypoint can run `prisma migrate deploy`
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

# Copy the startup script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["./docker-entrypoint.sh"]

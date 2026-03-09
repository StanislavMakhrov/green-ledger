FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat chromium nss freetype freetype-dev harfbuzz ca-certificates ttf-freefont
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat chromium nss freetype freetype-dev harfbuzz ca-certificates ttf-freefont
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="file:/data/greenledger.db"
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
WORKDIR /app
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV DATABASE_URL="file:/data/greenledger.db"
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN mkdir -p /data && chown nextjs:nodejs /data
COPY --from=builder /app/public/ ./public/
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/lib/constants.ts ./lib/constants.ts
COPY --from=builder /app/app/generated ./app/generated
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["sh", "-c", "node ./node_modules/prisma/build/index.js migrate deploy && (node ./node_modules/tsx/dist/cli.cjs prisma/seed.ts || true) && node server.js"]

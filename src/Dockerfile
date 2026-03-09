FROM node:20-slim

# Install Chromium and its dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
  chromium \
  fonts-liberation \
  libgbm1 \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libasound2 \
  --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Tell Puppeteer to use installed Chromium instead of downloading its own
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 3000

ENV DATABASE_URL="file:./prisma/data.db"
ENV NODE_ENV=production

CMD sh -c "npx prisma migrate deploy && npx prisma db seed && npm start"

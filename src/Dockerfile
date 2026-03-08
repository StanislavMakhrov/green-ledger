FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
ENV DATABASE_URL=file:./prisma/dev.db
CMD ["sh", "-c", "npx prisma migrate deploy && node_modules/.bin/next start"]

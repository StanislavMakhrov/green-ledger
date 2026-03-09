import { PrismaClient } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Prisma Client Singleton
// ─────────────────────────────────────────────────────────────────────────────
// Next.js hot-reload creates new module instances during development,
// which would create a new PrismaClient on every file change and exhaust
// the database connection pool. This pattern stores the client on globalThis
// so it survives hot-reloads.

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

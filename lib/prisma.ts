/**
 * Prisma client singleton for Next.js.
 *
 * In development, Next.js hot-reloads create new module instances, which
 * would exhaust the SQLite connection pool. We attach the client to the
 * global object so that it is reused across hot-reloads.
 *
 * In production a single module instance is created at startup.
 */
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

import { PrismaClient } from "@/app/generated/prisma";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Creates a PrismaClient instance using the libsql adapter for SQLite.
 * Prisma 7's new TypeScript client generator requires an adapter or accelerateUrl;
 * we use PrismaLibSql which supports local SQLite files via file:// URLs.
 */
function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const adapter = new PrismaLibSql({ url: databaseUrl });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

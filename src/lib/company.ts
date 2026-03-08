import { prisma } from "./prisma";

/**
 * Returns the first Company in the database.
 * Since GreenLedger MVP has no auth, all requests operate on this single company.
 */
export async function getDemoCompany() {
  return prisma.company.findFirst();
}

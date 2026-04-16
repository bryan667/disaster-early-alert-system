import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/config";

declare global {
  // eslint-disable-next-line no-var
  var __deasPrisma: PrismaClient | undefined;
}

export function getPrisma() {
  if (global.__deasPrisma) {
    return global.__deasPrisma;
  }

  const adapter = new PrismaPg({
    connectionString: env.databaseUrl,
  });
  const prisma = new PrismaClient({
    adapter,
  });

  if (process.env.NODE_ENV !== "production") {
    global.__deasPrisma = prisma;
  }

  return prisma;
}

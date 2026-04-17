import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/config";

type GlobalWithPrisma = typeof globalThis & {
  __deasPrisma?: PrismaClient;
};

const globalForPrisma = globalThis as GlobalWithPrisma;

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: env.databaseUrl,
  });

  return new PrismaClient({
    adapter,
  });
}

const prisma = globalForPrisma.__deasPrisma ?? createPrismaClient();

if (!globalForPrisma.__deasPrisma) {
  globalForPrisma.__deasPrisma = prisma;
}

export function getPrisma() {
  return prisma;
}

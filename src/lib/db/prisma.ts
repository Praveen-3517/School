import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prisma: PrismaClient;

if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  // Production / Remote Environment using Turso (Edge-ready)
  const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const adapter = new PrismaLibSQL(libsql);
  prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
} else {
  // Local Development Fallback using standard SQLite file
  const prismaClientOptions = {
    log:
      process.env.NODE_ENV === "development"
        ? (["query", "error", "warn"] as ["query", "error", "warn"])
        : (["error"] as ["error"]),
  };
  prisma = globalForPrisma.prisma ?? new PrismaClient(prismaClientOptions);
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { prisma };

import './env'; // Validate environment variables at startup

import { config } from "dotenv";
config({ path: ".env.local" });
config(); // fallback to .env

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("⚠️ DATABASE_URL is not set. Database operations will fail.");
} else if (process.env.NODE_ENV !== "production") {
  const host = connectionString.split("@")[1]?.split("/")[0];
  console.log(`🔌 Prisma connecting to: ${host}`);
}

// Prisma 7.x requires an adapter. Use adapter-pg for both direct and Data Proxy connections.
// Use a global singleton to avoid creating a new client on every request in production,
// which causes connection pool exhaustion and transient failures.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: connectionString ? new PrismaPg({ connectionString }) : undefined,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Cache the client globally for ALL environments, not just development.
// In production, without this, each serverless invocation creates a new client
// and exhausts the connection pool.
globalForPrisma.prisma = prisma;
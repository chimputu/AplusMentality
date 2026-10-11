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
const prisma = new PrismaClient({
  adapter: connectionString ? new PrismaPg({ connectionString }) : undefined,
});

export { prisma };
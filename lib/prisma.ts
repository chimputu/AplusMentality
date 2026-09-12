import { config } from "dotenv";
config({ path: ".env.local" });
config(); // fallback to .env

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Check .env.local or .env in your project root."
  );
}

if (process.env.NODE_ENV !== "production") {
  const host = connectionString.split("@")[1]?.split("/")[0];
  console.log(`🔌 Prisma connecting to: ${host}`);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
// scripts/backfill-usernames.ts
// One-time script to set username = email for existing users who have no username.
// Run: npx tsx scripts/backfill-usernames.ts

import { config } from "dotenv";
config();

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Check .env in your project root.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function backfillUsernames() {
  console.log("=== Backfilling usernames from emails ===\n");

  // Find all users with a null username
  const usersWithoutUsername = await prisma.user.findMany({
    where: {
      username: null,
    },
    select: {
      id: true,
      clerkId: true,
      email: true,
      name: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log(`Found ${usersWithoutUsername.length} users without a username.\n`);

  if (usersWithoutUsername.length === 0) {
    console.log("Nothing to do — all users have usernames.");
    await prisma.$disconnect();
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const user of usersWithoutUsername) {
    try {
      // Check if the email is already taken as a username by another user
      const existingUsername = await prisma.user.findUnique({
        where: { username: user.email },
        select: { id: true },
      });

      if (existingUsername && existingUsername.id !== user.id) {
        // Email is already used as someone else's username — use email prefix instead
        const fallbackUsername = user.email.split("@")[0].toLowerCase();
        console.log(
          `⚠️  ${user.email} already used by another user — skipping (${user.name || user.clerkId})`
        );
        skipped++;
        continue;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { username: user.email },
      });

      console.log(`✅ ${user.email} → username set (${user.name || user.clerkId})`);
      updated++;
    } catch (error) {
      console.error(`❌ Failed for ${user.email}:`, error);
      skipped++;
    }
  }

  console.log(`\n=== Done: ${updated} updated, ${skipped} skipped ===`);
  await prisma.$disconnect();
}

backfillUsernames().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

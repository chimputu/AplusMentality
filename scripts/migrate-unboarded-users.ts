// scripts/migrate-unboarded-users.ts
// One-time script to associate existing unonboarded users with institutions based on email domain.
// Run: npx tsx scripts/migrate-unboarded-users.ts

import { config } from "dotenv";
config();

import { PrismaClient } from "../generated/prisma/client";

const prisma = new PrismaClient();

// Email domain → institution slug mapping
// Based on the seed data in prisma/seed.ts
const DOMAIN_TO_INSTITUTION: Record<string, string> = {
  // University of Zambia
  "unza.zm": "unza",

  // Copperbelt University
  "cbu.ac.zm": "cbu",

  // University of Lusaka
  "unilus.ac.zm": "unilus",
  "unilus.zm": "unilus",

  // Mulungushi University
  "mu.ac.zm": "mulungushi",

  // Zambia Open University
  "zaou.ac.zm": "zaou",

  // National Institute of Public Administration
  "nipa.org.zm": "nipa",

  // Zambia Centre for Accountancy Studies
  "zcas.ac.zm": "zcas",

  // Northern Technical College
  "nortec.ac.zm": "nortec",

  // Evelyn Hone College
  "evelynhone.ac.zm": "evelyn-hone",

  // Chainama College of Health Sciences
  "chainama.ac.zm": "chainama",

  // Graduate School of Business - UNZA
  "gsb.unza.zm": "gsb-unza",

  // Information and Communications University
  "icu.ac.zm": "icu",
};

function extractDomain(email: string): string | null {
  const parts = email.split("@");
  if (parts.length !== 2) return null;
  return parts[1].toLowerCase();
}

function findInstitutionSlug(email: string): string | null {
  const domain = extractDomain(email);
  if (!domain) return null;

  // Direct match
  if (DOMAIN_TO_INSTITUTION[domain]) {
    return DOMAIN_TO_INSTITUTION[domain];
  }

  // Fuzzy match: check if domain contains the institution key
  for (const [dom, slug] of Object.entries(DOMAIN_TO_INSTITUTION)) {
    if (domain.includes(dom.split(".")[0])) {
      return slug;
    }
  }

  return null;
}

async function migrateUsers() {
  console.log("=== Migrating Unonboarded Users to Institutions ===\n");

  // Find all users who are not onboarded and have no institution/university
  const unboardedUsers = await prisma.user.findMany({
    where: {
      onboarded: false,
      institutionId: null,
      universityId: null,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log(`Found ${unboardedUsers.length} unonboarded users without an institution.\n`);

  if (unboardedUsers.length === 0) {
    console.log("Nothing to migrate — all users are onboarded or have an institution.");
    await prisma.$disconnect();
    return;
  }

  // Load all active institutions into a map for quick lookup
  const institutions = await prisma.university.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, name: true },
  });
  const institutionMap = new Map(institutions.map((i) => [i.slug, i]));

  let updated = 0;
  let matched_but_failed = 0;
  const unmatched: string[] = [];
  const matched: { email: string; institution: string }[] = [];

  for (const user of unboardedUsers) {
    const slug = findInstitutionSlug(user.email);

    if (!slug) {
      unmatched.push(`${user.email} (no matching institution domain)`);
      continue;
    }

    const institution = institutionMap.get(slug);
    if (!institution) {
      unmatched.push(
        `${user.email} (domain matched "${slug}" but institution not found in DB)`
      );
      continue;
    }

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          institutionId: institution.id,
          onboarded: true,
        },
      });

      console.log(
        `✅ ${user.email} → ${institution.name} (${slug})`
      );
      matched.push({ email: user.email, institution: institution.name });
      updated++;
    } catch (error) {
      console.error(`❌ Failed for ${user.email}:`, error);
      matched_but_failed++;
    }
  }

  console.log(`\n=== Results ===`);
  console.log(`Successfully matched: ${updated}`);
  console.log(`Matched but failed to update: ${matched_but_failed}`);
  console.log(`Unmatched (no institution domain): ${unmatched.length}`);

  if (unmatched.length > 0) {
    console.log("\nUnmatched users (complete onboarding manually):");
    unmatched.forEach((u) => console.log(`  - ${u}`));
  }

  if (matched.length > 0) {
    console.log("\nMatched users:");
    matched.forEach((m) => console.log(`  - ${m.email} → ${m.institution}`));
  }

  await prisma.$disconnect();
}

migrateUsers().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

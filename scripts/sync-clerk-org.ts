/**
 * Sync missing clerkOrgId for institutions that have a Clerk organization
 * but no matching database record.
 *
 * Usage:
 *   npx tsx scripts/sync-clerk-org.ts                          # List orphaned orgs
 *   npx tsx scripts/sync-clerk-org.ts --fix                    # Auto-link by name
 *   npx tsx scripts/sync-clerk-org.ts --fix --org org_123      # Link a specific org
 *   npx tsx scripts/sync-clerk-org.ts --fix --org org_123 --name "Copperbelt University"
 *
 * This fixes the error:
 *   "Institution not found for Clerk org org_3LQihSUMyTVUbQsJaZAMEG1Mu5V"
 */
import { prisma } from '@/lib/prisma';

async function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  const specificOrg = args.slice().findIndex(a => a === '--org');
  const orgId = specificOrg > 0 ? args[specificOrg + 1] : null;
  const nameHint = args.slice().findIndex(a => a === '--name');
  const nameValue = nameHint > 0 ? args[nameHint + 1] : null;

  // 1. Find all University records that do NOT have a clerkOrgId
  const unlinked = await prisma.university.findMany({
    where: { clerkOrgId: null },
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  });

  console.log(`Found ${unlinked.length} institution(s) without a linked Clerk org.\n`);

  if (unlinked.length === 0) {
    console.log('All institutions are linked. Nothing to do.');
    await prisma.$disconnect();
    return;
  }

  // 2. If a specific org ID is provided, try to match it by name
  if (orgId) {
    console.log(`Attempting to link Clerk org "${orgId}" to an institution...\n`);

    // If a name hint is provided, match exactly
    if (nameValue) {
      const match = unlinked.find(
        (u) =>
          u.name.toLowerCase().includes(nameValue.toLowerCase()) ||
          u.slug.toLowerCase().includes(nameValue.toLowerCase())
      );
      if (match) {
        if (shouldFix) {
          await prisma.university.update({
            where: { id: match.id },
            data: { clerkOrgId: orgId, clerkOrgSlug: match.slug },
          });
          console.log(`✓ Linked "${match.name}" (${match.slug}) → ${orgId}`);
        } else {
          console.log(`Would link "${match.name}" (${match.slug}) → ${orgId}`);
          console.log('Run with --fix to apply.');
        }
      } else {
        console.log(`✗ No institution matches name hint "${nameValue}".`);
        console.log('Available institutions:');
        unlinked.forEach((u) => console.log(`  - ${u.name} (${u.slug})`));
      }
    } else {
      // Try fuzzy match: find the institution whose name best matches the org
      // We'll list candidates and pick the first one if --fix is provided
      console.log(`Candidates for org "${orgId}":`);
      unlinked.forEach((u) => console.log(`  - ${u.name} (${u.slug})`));
      if (shouldFix && unlinked.length === 1) {
        const match = unlinked[0];
        await prisma.university.update({
          where: { id: match.id },
          data: { clerkOrgId: orgId, clerkOrgSlug: match.slug },
        });
        console.log(`✓ Linked "${match.name}" (${match.slug}) → ${orgId}`);
      } else if (shouldFix) {
        console.log('Multiple candidates found. Use --name to specify which one.');
      } else {
        console.log('Run with --fix --name "..." to apply.');
      }
    }

    await prisma.$disconnect();
    return;
  }

  // 3. List mode — show all unlinked institutions
  console.log('Unlinked institutions (clerkOrgId is NULL):\n');
  unlinked.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.name} (slug: ${u.slug}, id: ${u.id})`);
  });

  console.log('\nTo link a specific Clerk org, run:');
  console.log(`  npx tsx scripts/sync-clerk-org.ts --fix --org <org_id> --name "<institution_name>"`);
  console.log('\nExample for the production error:');
  console.log(`  npx tsx scripts/sync-clerk-org.ts --fix --org org_3LQihSUMyTVUbQsJaZAMEG1Mu5V --name "Copperbelt"`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

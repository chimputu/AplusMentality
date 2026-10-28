// One-time script to purge non-university records from the University table.
// Regulatory bodies (ZICTA, ZICA), professional bodies (ZBS), and standalone
// colleges (Zambia School of Law) should NOT be in the University table.
//
// Run with: npx tsx scripts/clean-university-table.ts
// WARNING: This permanently deletes records. Ensure you have a backup before running.

import 'dotenv/config';
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Names/patterns of records that are NOT universities and should be removed
const NON_UNIVERSITY_NAMES = [
  'ZICTA',
  'Zambia Information and Communications Technology Authority',
  'ZICA',
  'Zambia Institute of Chartered Accountants',
  'ZBS',
  'Zambia Bureau of Standards',
  'Zambia School of Law',
  'ZSL',
  'Zambia Accounting Corporation',
  'ZAC',
  'Patents and Companies Registration Agency',
  'PACRA',
  'Zambia Regulatory Commission',
  'ZRC',
  'University of Technology', // Standalone college, not a university
  'Zambia Technical College',
];

// Codes that are NOT university codes
const NON_UNIVERSITY_CODES = [
  'ZICTA',
  'ZICA',
  'ZBS',
  'ZSL',
  'ZAC',
  'PACRA',
  'ZRC',
];

async function main() {
  console.log('=== University Table Cleanup Script ===\n');

  // Get all current university records
  const allUniversities = await prisma.university.findMany({
    orderBy: { name: 'asc' },
  });

  console.log(`Total University records: ${allUniversities.length}\n`);

  // Identify records to delete
  const toDelete = allUniversities.filter((u) => {
    const nameLower = u.name.toLowerCase();
    const codeLower = (u.code || '').toLowerCase();

    const isNonUniversityName = NON_UNIVERSITY_NAMES.some((pattern) =>
      nameLower.includes(pattern.toLowerCase())
    );
    const isNonUniversityCode = NON_UNIVERSITY_CODES.some((pattern) =>
      codeLower === pattern.toLowerCase()
    );

    return isNonUniversityName || isNonUniversityCode;
  });

  if (toDelete.length === 0) {
    console.log('No non-university records found. Nothing to clean up.');
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${toDelete.length} non-university record(s) to delete:\n`);
  toDelete.forEach((u) => {
    console.log(`  - "${u.name}" (code: ${u.code}, id: ${u.id})`);
  });
  console.log();

  // Check for dependent records before deleting
  const idsToDelete = toDelete.map((u) => u.id);

  const programmeCount = await prisma.programme.count({
    where: { universityId: { in: idsToDelete } },
  });
  const courseCount = await prisma.course.count({
    where: { universityId: { in: idsToDelete } },
  });
  const tutorCount = await prisma.tutor.count({
    where: { universityId: { in: idsToDelete } },
  });
  const userCount = await prisma.user.count({
    where: { universityId: { in: idsToDelete } },
  });

  console.log('Dependent records that will be nullified (onDelete: SetNull):');
  console.log(`  Programmes: ${programmeCount}`);
  console.log(`  Courses: ${courseCount}`);
  console.log(`  Tutors: ${tutorCount}`);
  console.log(`  Users: ${userCount}`);
  console.log();

  // Perform the deletion by IDs for precision
  console.log('Deleting non-university records...\n');
  let deletedCount = 0;
  for (const id of idsToDelete) {
    try {
      await prisma.university.delete({ where: { id } });
      deletedCount++;
    } catch (error) {
      console.log(`  ⚠ Failed to delete ${id}: ${error}`);
    }
  }

  console.log(`\n✅ Deleted ${deletedCount} non-university record(s).\n`);

  // Verify remaining records
  const remaining = await prisma.university.findMany({
    orderBy: { name: 'asc' },
  });

  console.log(`Remaining University records (${remaining.length}):`);
  remaining.forEach((u) => {
    console.log(`  - "${u.name}" (code: ${u.code})`);
  });

  await prisma.$disconnect();
  console.log('\n✅ Cleanup complete.');
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

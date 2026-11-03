/**
 * Seed Mulungushi University (MU) record.
 * MU is the main priority university for the A+ Mentality platform.
 *
 * Note: clerkOrgId is not set yet. Once you have the Clerk org ID for MU,
 * run: npx tsx scripts/sync-clerk-org.ts --fix --org <org_id> --name "Mulungushi"
 *
 * Run with: npx tsx scripts/seed-mu.ts
 */
import { prisma } from '@/lib/prisma';

async function main() {
  console.log('Seeding Mulungushi University (MU)...\n');

  // Check if it already exists
  const existing = await prisma.university.findFirst({
    where: {
      OR: [
        { name: { contains: 'Mulungushi', mode: 'insensitive' } },
        { slug: 'mulungushi-university' },
      ],
    },
  });

  if (existing) {
    console.log('Mulungushi University already exists:');
    console.log('  ID:', existing.id);
    console.log('  Name:', existing.name);
    console.log('  Clerk Org ID:', existing.clerkOrgId || '(not linked)');

    if (!existing.clerkOrgId) {
      console.log('\n⚠ Note: This record is not linked to a Clerk org yet.');
      console.log('  Once you have the Clerk org ID, run:');
      console.log('  npx tsx scripts/sync-clerk-org.ts --fix --org <org_id> --name "Mulungushi"');
    }

    await prisma.$disconnect();
    return;
  }

  // Create the Mulungushi University record
  console.log('Creating Mulungushi University record...\n');
  const university = await prisma.university.create({
    data: {
      name: 'Mulungushi University',
      slug: 'mulungushi-university',
      shortName: 'MU',
      type: 'UNIVERSITY',
      description: 'Mulungushi University is a public university in Kabwe, Zambia. Primary institution for the A+ Mentality platform.',
      country: 'Zambia',
      city: 'Kabwe',
      website: 'https://www.mu.ac.zm',
      levelType: 'YEAR',
      numLevels: 4,
      periodType: 'SEMESTER',
      numPeriods: 2,
      hasFaculties: true,
      hasBranches: true,
      isActive: true,
      isVerified: true,
      levels: {
        create: [
          { name: 'Year 1', order: 1 },
          { name: 'Year 2', order: 2 },
          { name: 'Year 3', order: 3 },
          { name: 'Year 4', order: 4 },
        ],
      },
      periods: {
        create: [
          { name: 'Semester 1', order: 1, academicYear: 2025 },
          { name: 'Semester 2', order: 2, academicYear: 2025 },
        ],
      },
    },
  });

  console.log('✓ Created Mulungushi University');
  console.log('  ID:', university.id);
  console.log('  Name:', university.name);
  console.log('  Slug:', university.slug);
  console.log('  Short Name:', university.shortName);
  console.log('  City:', university.city);
  console.log('  Active:', university.isActive);
  console.log('  Verified:', university.isVerified);

  // Seed programmes based on seed-universities.ts data
  const programmes = [
    { name: 'Bachelor of Commerce', shortName: 'BCom', code: 'BCOM', branches: ['Accounting', 'Finance', 'Marketing', 'Human Resources'] },
    { name: 'Bachelor of Information Technology', shortName: 'BIT', code: 'BIT', branches: ['Computer Science', 'Information Systems'] },
    { name: 'Bachelor of Education', shortName: 'BEd', code: 'BED', branches: ['General Education', 'Science Education'] },
    { name: 'Bachelor of Arts', shortName: 'BA', code: 'BA', branches: ['English', 'Political Science'] },
    { name: 'Bachelor of Science', shortName: 'BSc', code: 'BSC', branches: ['Biology', 'Chemistry', 'Mathematics'] },
    { name: 'Diploma in Information Technology', shortName: 'DIP-IT', code: 'DIP-IT' },
    { name: 'Diploma in Accounting', shortName: 'DIP-ACC', code: 'DIP-ACC' },
  ];

  console.log('\nSeeding programmes...');
  for (const prog of programmes) {
    const created = await prisma.programme.upsert({
      where: {
        institutionId_code: {
          institutionId: university.id,
          code: prog.code,
        },
      },
      update: {},
      create: {
        name: prog.name,
        shortName: prog.shortName,
        code: prog.code,
        institutionId: university.id,
      },
    });
    console.log(`  ✓ ${prog.name} (${prog.code})`);

    // Create branches if applicable
    if (prog.branches) {
      for (const branch of prog.branches) {
        // Check if branch already exists for this programme
        const existing = await prisma.branch.findFirst({
          where: {
            programmeId: created.id,
            name: branch,
          },
        });
        if (!existing) {
          await prisma.branch.create({
            data: {
              name: branch,
              programmeId: created.id,
            },
          });
        }
      }
      console.log(`    → ${prog.branches.length} branches created`);
    }
  }

  console.log('\nDone! Mulungushi University is now seeded.');
  console.log('\n⚠ Next steps:');
  console.log('  1. Create a Clerk organization for MU in the Clerk dashboard');
  console.log('  2. Link it by running:');
  console.log('     npx tsx scripts/sync-clerk-org.ts --fix --org <org_id> --name "Mulungushi"');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

/**
 * Seed the Copperbelt University record with the correct Clerk org linkage.
 * This fixes the production error:
 *   "Institution not found for Clerk org org_3LQihSUMyTVUbQsJaZAMEG1Mu5V"
 *
 * Run with: npx tsx scripts/seed-copperbelt.ts
 */
import { prisma } from '@/lib/prisma';

async function main() {
  console.log('Seeding Copperbelt University...\n');

  // Check if it already exists
  const existing = await prisma.university.findFirst({
    where: {
      OR: [
        { name: { contains: 'Copperbelt', mode: 'insensitive' } },
        { clerkOrgId: 'org_3LQihSUMyTVUbQsJaZAMEG1Mu5V' },
      ],
    },
  });

  if (existing) {
    console.log('Copperbelt University already exists:');
    console.log('  ID:', existing.id);
    console.log('  Name:', existing.name);
    console.log('  Clerk Org ID:', existing.clerkOrgId || '(not linked)');
    console.log('  Clerk Org Slug:', existing.clerkOrgSlug || '(not set)');

    // If it exists but doesn't have the clerkOrgId, update it
    if (!existing.clerkOrgId) {
      console.log('\nLinking to Clerk org...');
      const updated = await prisma.university.update({
        where: { id: existing.id },
        data: {
          clerkOrgId: 'org_3LQihSUMyTVUbQsJaZAMEG1Mu5V',
          clerkOrgSlug: 'copperbelt-university',
        },
      });
      console.log('✓ Linked Copperbelt University to Clerk org');
      console.log('  Clerk Org ID:', updated.clerkOrgId);
    } else {
      console.log('✓ Already linked to Clerk org');
    }

    await prisma.$disconnect();
    return;
  }

  // Create the Copperbelt University record
  console.log('Creating Copperbelt University record...\n');
  const university = await prisma.university.create({
    data: {
      name: 'Copperbelt University',
      slug: 'copperbelt-university',
      shortName: 'CBU',
      type: 'UNIVERSITY',
      description: 'Copperbelt University is a public university in Kitwe, Zambia.',
      country: 'Zambia',
      city: 'Kitwe',
      website: 'https://www.cbu.ac.zm',
      levelType: 'YEAR',
      numLevels: 4,
      periodType: 'SEMESTER',
      numPeriods: 2,
      hasFaculties: true,
      hasBranches: true,
      isActive: true,
      isVerified: true,
      clerkOrgId: 'org_3LQihSUMyTVUbQsJaZAMEG1Mu5V',
      clerkOrgSlug: 'copperbelt-university',
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

  console.log('✓ Created Copperbelt University');
  console.log('  ID:', university.id);
  console.log('  Name:', university.name);
  console.log('  Slug:', university.slug);
  console.log('  Clerk Org ID:', university.clerkOrgId);
  console.log('  Clerk Org Slug:', university.clerkOrgSlug);

  // Seed some common programmes
  const programmes = [
    { name: 'BSc Information Technology', shortName: 'BSc IT', code: 'BSC-IT' },
    { name: 'Bachelor of Engineering', shortName: 'BEng', code: 'BENG' },
    { name: 'Bachelor of Commerce', shortName: 'BCom', code: 'BCOM' },
    { name: 'BSc Natural Sciences', shortName: 'BSc NS', code: 'BSC-NS' },
    { name: 'Bachelor of Medicine and Bachelor of Surgery', shortName: 'MBChB', code: 'MBCHB' },
    { name: 'Bachelor of Nursing', shortName: 'BSc Nursing', code: 'BSC-NURSING' },
    { name: 'Diploma in Information Technology', shortName: 'DIP-IT', code: 'DIP-IT' },
  ];

  console.log('\nSeeding programmes...');
  for (const prog of programmes) {
    await prisma.programme.upsert({
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
    console.log(`  ✓ ${prog.name}`);
  }

  console.log('\nDone! Copperbelt University is now linked to Clerk org org_3LQihSUMyTVUbQsJaZAMEG1Mu5V');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

/**
 * Migration: Map LegacyUniversity records to the canonical University (Institution) table.
 *
 * This script:
 * 1. Reads all LegacyUniversity records
 * 2. For each, checks if a matching University record exists (by name or code)
 * 3. If not, creates a new University record
 * 4. Maps all users with universityId to institutionId
 * 5. Maps all courses with universityId to institution via programme
 * 6. Maps all programmes with universityId to institutionId
 * 7. Maps all tutors with universityId to institutionId
 *
 * Run: npx tsx scripts/migrate-legacy-to-canonical.ts
 */
import 'dotenv/config';
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, InstitutionType, LevelType, PeriodType } from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔄 Starting LegacyUniversity → University migration...\n');

  // 1. Get all legacy universities
  const legacyUnis = await prisma.legacyUniversity.findMany({
    orderBy: { name: 'asc' },
  });
  console.log(`📋 Found ${legacyUnis.length} LegacyUniversity records\n`);

  let mappedCount = 0;
  let createdCount = 0;

  for (const legacy of legacyUnis) {
    // Try to find an existing University by slug (code lowercased) or name
    const slug = legacy.code.toLowerCase();
    let university = await prisma.university.findFirst({
      where: {
        OR: [
          { slug: slug },
          { name: legacy.name },
        ],
      },
    });

    if (!university) {
      // Create a new University record from the legacy data
      university = await prisma.university.create({
        data: {
          name: legacy.name,
          slug: slug,
          shortName: legacy.code,
          type: InstitutionType.UNIVERSITY,
          description: `Migrated from LegacyUniversity (code: ${legacy.code})`,
          country: 'Zambia',
          levelType: LevelType.YEAR,
          numLevels: 4,
          periodType: legacy.academicSystem === 'TRIMESTERLY' ? PeriodType.TRIMESTER : PeriodType.SEMESTER,
          numPeriods: legacy.academicSystem === 'TRIMESTERLY' ? 3 : 2,
          isActive: true,
          isVerified: true,
          joinSlug: legacy.joinSlug || null,
        },
      });
      createdCount++;
      console.log(`  ✨ Created: ${university.name} (slug: ${university.slug})`);
    } else {
      // Update joinSlug if the legacy record has one and the canonical doesn't
      if (legacy.joinSlug && !university.joinSlug) {
        await prisma.university.update({
          where: { id: university.id },
          data: { joinSlug: legacy.joinSlug },
        });
      }
    }

    mappedCount++;
    console.log(`  ✅ Mapped: ${legacy.name} → ${university.name} (${university.id})`);
  }

  console.log(`\n📊 Mapping summary: ${mappedCount} mapped, ${createdCount} new created\n`);

  // 2. Migrate users: set institutionId from universityId
  const usersWithLegacy = await prisma.user.findMany({
    where: {
      universityId: { not: null },
      institutionId: null,
    },
    select: { id: true, universityId: true },
  });
  console.log(`👤 Found ${usersWithLegacy.length} users with legacy universityId`);

  for (const user of usersWithLegacy) {
    // Find the mapped University for this legacy university
    const legacyUni = await prisma.legacyUniversity.findUnique({
      where: { id: user.universityId },
    });
    if (legacyUni) {
      const slug = legacyUni.code.toLowerCase();
      const university = await prisma.university.findFirst({
        where: {
          OR: [
            { slug: slug },
            { name: legacyUni.name },
          ],
        },
      });
      if (university) {
        await prisma.user.update({
          where: { id: user.id },
          data: { institutionId: university.id },
        });
      }
    }
  }
  console.log('✅ Users migrated\n');

  // 3. Migrate programmes: set institutionId from universityId
  const progsWithLegacy = await prisma.programme.findMany({
    where: {
      universityId: { not: null },
      institutionId: null,
    },
    select: { id: true, universityId: true },
  });
  console.log(`📚 Found ${progsWithLegacy.length} programmes with legacy universityId`);

  for (const prog of progsWithLegacy) {
    const legacyUni = await prisma.legacyUniversity.findUnique({
      where: { id: prog.universityId },
    });
    if (legacyUni) {
      const slug = legacyUni.code.toLowerCase();
      const university = await prisma.university.findFirst({
        where: {
          OR: [
            { slug: slug },
            { name: legacyUni.name },
          ],
        },
      });
      if (university) {
        await prisma.programme.update({
          where: { id: prog.id },
          data: { institutionId: university.id },
        });
      }
    }
  }
  console.log('✅ Programmes migrated\n');

  // 4. Migrate tutors: set institutionId from universityId
  const tutorsWithLegacy = await prisma.tutor.findMany({
    where: {
      universityId: { not: null },
    },
    select: { id: true, universityId: true },
  });
  console.log(`👨‍🏫 Found ${tutorsWithLegacy.length} tutors with legacy universityId`);

  for (const tutor of tutorsWithLegacy) {
    const legacyUni = await prisma.legacyUniversity.findUnique({
      where: { id: tutor.universityId },
    });
    if (legacyUni) {
      const slug = legacyUni.code.toLowerCase();
      const university = await prisma.university.findFirst({
        where: {
          OR: [
            { slug: slug },
            { name: legacyUni.name },
          ],
        },
      });
      if (university) {
        await prisma.tutor.update({
          where: { id: tutor.id },
          data: { institutionId: university.id },
        });
      }
    }
  }
  console.log('✅ Tutors migrated\n');

  console.log('═══════════════════════════════════════════');
  console.log('✅ Migration completed successfully!');
  console.log('═══════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

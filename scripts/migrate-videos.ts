// scripts/migrate-videos.ts
// One-time script to link existing videos to courses based on title regex
// Run: npx tsx scripts/migrate-videos.ts

import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();

async function migrateVideos() {
  console.log('=== Migrating Videos to Courses ===\n');

  // Find all videos without a courseId
  const unlinkedVideos = await prisma.video.findMany({
    where: {
      courseId: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log(`Found ${unlinkedVideos.length} videos without a course.\n`);

  if (unlinkedVideos.length === 0) {
    console.log('Nothing to migrate.');
    await prisma.$disconnect();
    return;
  }

  let matched = 0;
  let unmatched: string[] = [];

  for (const video of unlinkedVideos) {
    // Extract course code from title: e.g. "CS 101", "MSM111", "BUS-201"
    const codeMatch = video.title.match(/\b([A-Z]{2,4}[\s-]?\d{2,4})\b/i);

    if (!codeMatch) {
      unmatched.push(`${video.title} (no course code found)`);
      continue;
    }

    const extractedCode = codeMatch[1].trim();

    // Find matching course (case-insensitive)
    const course = await prisma.course.findFirst({
      where: {
        code: {
          equals: extractedCode,
          mode: 'insensitive',
        },
      },
    });

    if (!course) {
      unmatched.push(`${video.title} (code: ${extractedCode}, no matching course)`);
      continue;
    }

    // Calculate order: count existing videos in this course
    const existingCount = await prisma.video.count({
      where: {
        courseId: course.id,
        id: { not: video.id },
      },
    });

    // Update video with courseId and order
    await prisma.video.update({
      where: { id: video.id },
      data: {
        courseId: course.id,
        order: existingCount + 1,
      },
    });

    console.log(`✓ "${video.title}" → ${course.code} ${course.title} (order: ${existingCount + 1})`);
    matched++;
  }

  console.log(`\n=== Results ===`);
  console.log(`Matched: ${matched}`);
  console.log(`Unmatched: ${unmatched.length}`);

  if (unmatched.length > 0) {
    console.log('\nUnmatched videos (fix manually in Prisma Studio):');
    unmatched.forEach(v => console.log(`  - ${v}`));
  }

  await prisma.$disconnect();
}

migrateVideos().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

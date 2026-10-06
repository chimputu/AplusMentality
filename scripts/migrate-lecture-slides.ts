// scripts/migrate-lecture-slides.ts
// One-time script to link existing lecture slides to courses
// Run: npx tsx scripts/migrate-lecture-slides.ts

import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();

async function migrateLectureSlides() {
  console.log('=== Migrating Lecture Slides to Courses ===\n');

  // Find all lecture slides without a courseId
  const unlinkedSlides = await prisma.lectureSlide.findMany({
    where: {
      courseId: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log(`Found ${unlinkedSlides.length} lecture slides without a course.\n`);

  if (unlinkedSlides.length === 0) {
    console.log('Nothing to migrate.');
    await prisma.$disconnect();
    return;
  }

  let matched = 0;
  let unmatched: string[] = [];

  for (const slide of unlinkedSlides) {
    // Extract course code from title
    const codeMatch = slide.title.match(/\b([A-Z]{2,4}[\s-]?\d{2,4})\b/i);

    if (!codeMatch) {
      unmatched.push(`${slide.title} (no course code found)`);
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
      unmatched.push(`${slide.title} (code: ${extractedCode}, no matching course)`);
      continue;
    }

    // Calculate order: count existing slides in this course
    const existingCount = await prisma.lectureSlide.count({
      where: {
        courseId: course.id,
        id: { not: slide.id },
      },
    });

    // Update slide with courseId and order
    await prisma.lectureSlide.update({
      where: { id: slide.id },
      data: {
        courseId: course.id,
        order: existingCount + 1,
      },
    });

    console.log(`✓ "${slide.title}" → ${course.code} ${course.title} (order: ${existingCount + 1})`);
    matched++;
  }

  console.log(`\n=== Results ===`);
  console.log(`Matched: ${matched}`);
  console.log(`Unmatched: ${unmatched.length}`);

  if (unmatched.length > 0) {
    console.log('\nUnmatched slides (fix manually in Prisma Studio):');
    unmatched.forEach(v => console.log(`  - ${v}`));
  }

  await prisma.$disconnect();
}

migrateLectureSlides().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

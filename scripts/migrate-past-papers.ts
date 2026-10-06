// scripts/migrate-past-papers.ts
// One-time script to link existing past papers to courses based on courseCode field
// Run: npx tsx scripts/migrate-past-papers.ts

import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();

async function migratePastPapers() {
  console.log('=== Migrating Past Papers to Courses ===\n');

  // Find all past papers without a courseId
  const unlinkedPapers = await prisma.pastPaper.findMany({
    where: {
      courseId: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log(`Found ${unlinkedPapers.length} past papers without a course.\n`);

  if (unlinkedPapers.length === 0) {
    console.log('Nothing to migrate.');
    await prisma.$disconnect();
    return;
  }

  let matched = 0;
  let unmatched: string[] = [];

  for (const paper of unlinkedPapers) {
    // Use courseCode field if available, otherwise extract from title
    let extractedCode = paper.courseCode?.trim();

    if (!extractedCode) {
      const codeMatch = paper.title.match(/\b([A-Z]{2,4}[\s-]?\d{2,4})\b/i);
      if (codeMatch) {
        extractedCode = codeMatch[1].trim();
      }
    }

    if (!extractedCode) {
      unmatched.push(`${paper.title} (no course code found)`);
      continue;
    }

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
      unmatched.push(`${paper.title} (code: ${extractedCode}, no matching course)`);
      continue;
    }

    // Update past paper with courseId
    await prisma.pastPaper.update({
      where: { id: paper.id },
      data: {
        courseId: course.id,
      },
    });

    console.log(`✓ "${paper.title}" → ${course.code} ${course.title}`);
    matched++;
  }

  console.log(`\n=== Results ===`);
  console.log(`Matched: ${matched}`);
  console.log(`Unmatched: ${unmatched.length}`);

  if (unmatched.length > 0) {
    console.log('\nUnmatched past papers (fix manually in Prisma Studio):');
    unmatched.forEach(v => console.log(`  - ${v}`));
  }

  await prisma.$disconnect();
}

migratePastPapers().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

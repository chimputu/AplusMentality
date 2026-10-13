// Temporary diagnostic script to check database connectivity and user records
import { prisma } from '@/lib/prisma';

async function main() {
  try {
    console.log('Testing database connection...');
    const count = await prisma.user.count();
    console.log(`✓ Database connected! User count: ${count}`);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        role: true,
        name: true,
      },
    });
    console.log('\nAll users:');
    console.log(JSON.stringify(users, null, 2));

    await prisma.$disconnect();
    console.log('\n✓ Done');
  } catch (error: any) {
    console.error('✗ Database error:', error.message);
    process.exit(1);
  }
}

main();

import { config } from 'dotenv';
config({ path: '.env.local' });
config(); // fallback to .env

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL is not set. Please check your .env file.');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  console.log('🧹 Cleaning up old test banners...');
  await prisma.bannerTarget.deleteMany({
    where: {
      banner: {
        title: {
          contains: '[TEST]',
        },
      },
    },
  });
  await prisma.banner.deleteMany({
    where: {
      title: {
        contains: '[TEST]',
      },
    },
  });

  console.log('📝 Creating test banners...');

  // Get an institution for targeting
  const institution = await prisma.university.findFirst();
  console.log(`🏫 Using institution: ${institution?.name || 'none'}`);

  // Test Banner 1: Global homepage banner with image
  const banner1 = await prisma.banner.create({
    data: {
      title: '[TEST] Welcome to A+ Mentality!',
      message: 'This is a test banner for the homepage. It should appear at the top of the page.',
      ctaLabel: 'Learn More',
      ctaUrl: '/explore',
      imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&h=400&fit=crop',
      variant: 'PROMO',
      placement: 'HOMEPAGE',
      scope: 'GLOBAL',
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      isActive: true,
      priority: 10,
    },
  });
  console.log(`✅ Created banner 1: ${banner1.id}`);

  // Test Banner 2: Dashboard info banner
  const banner2 = await prisma.banner.create({
    data: {
      title: '[TEST] New Features Available',
      message: 'Check out the new AI Assistant feature in your dashboard!',
      ctaLabel: 'Try Now',
      ctaUrl: '/dashboard',
      variant: 'INFO',
      placement: 'DASHBOARD',
      scope: 'GLOBAL',
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      isActive: true,
      priority: 5,
    },
  });
  console.log(`✅ Created banner 2: ${banner2.id}`);

  // Test Banner 3: Success banner with institution targeting
  if (institution) {
    const banner3 = await prisma.banner.create({
      data: {
        title: '[TEST] Congratulations!',
        message: `You've completed 50% of your courses at ${institution.name}.`,
        variant: 'SUCCESS',
        placement: 'HOMEPAGE',
        scope: 'SPECIFIC',
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        isActive: true,
        priority: 1,
        targets: {
          create: {
            institutionId: institution.id,
          },
        },
      },
    });
    console.log(`✅ Created banner 3: ${banner3.id}`);
  }

  // Test Banner 4: Warning banner (inactive, should not appear)
  const banner4 = await prisma.banner.create({
    data: {
      title: '[TEST] Maintenance Notice',
      message: 'The system will be under maintenance tonight.',
      variant: 'WARNING',
      placement: 'HOMEPAGE',
      scope: 'GLOBAL',
      startsAt: new Date(),
      endsAt: new Date(),
      isActive: false,
      priority: 0,
    },
  });
  console.log(`✅ Created banner 4 (inactive): ${banner4.id}`);

  console.log('\n📊 Test banners created:');
  console.log(`- Banner 1: Global homepage promo (active)`);
  console.log(`- Banner 2: Global dashboard info (active)`);
  console.log(`- Banner 3: Specific institution success (active)`);
  console.log(`- Banner 4: Global homepage warning (inactive)`);

  console.log('\n🔍 To verify:');
  console.log('1. Visit /api/debug/banners to see all banners');
  console.log('2. Visit /api/banners/active?placement=HOMEPAGE to see active homepage banners');
  console.log('3. Visit / to see the banner carousel on the homepage');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

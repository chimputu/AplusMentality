#!/usr/bin/env node
/**
 * Script to fix the "C++" video record that shows "This content is blocked."
 *
 * The video likely has an invalid YouTube URL or missing youtubeId.
 * This script finds the video and updates it with a valid YouTube URL.
 *
 * Usage:
 *   node scripts/fix-cpp-video.js
 *
 * To update with a specific YouTube URL:
 *   node scripts/fix-cpp-video.js https://www.youtube.com/watch?v=e_04ZrX3y0k
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]+)/,
    /(?:youtu\.be\/)([\w-]+)/,
    /(?:youtube\.com\/embed\/)([\w-]+)/,
    /(?:youtube\.com\/shorts\/)([\w-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function main() {
  const providedUrl = process.argv[2];

  console.log('=== Finding videos with title "C++" ===\n');

  // Find all videos with "C++" in the title
  const videos = await prisma.video.findMany({
    where: {
      title: {
        contains: 'C++',
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      title: true,
      url: true,
      youtubeId: true,
      source: true,
      thumbnail: true,
      createdAt: true,
    },
  });

  if (videos.length === 0) {
    console.log('No videos found with "C++" in the title.');
    console.log('Listing all videos to help you identify the correct one:\n');

    const allVideos = await prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        url: true,
        youtubeId: true,
        source: true,
      },
    });

    allVideos.forEach((v, i) => {
      console.log(`${i + 1}. Title: "${v.title}"`);
      console.log(`   URL: ${v.url}`);
      console.log(`   YouTube ID: ${v.youtubeId || '(none)'}`);
      console.log(`   Source: ${v.source || '(none)'}`);
      console.log();
    });

    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${videos.length} video(s) with "C++" in the title:\n`);

  for (const video of videos) {
    console.log(`ID: ${video.id}`);
    console.log(`Title: "${video.title}"`);
    console.log(`URL: ${video.url}`);
    console.log(`YouTube ID: ${video.youtubeId || '(none)'}`);
    console.log(`Source: ${video.source || '(none)'}`);
    console.log(`Thumbnail: ${video.thumbnail || '(none)'}`);
    console.log(`Created: ${video.createdAt}`);
    console.log();

    // Check if the video needs fixing
    const needsFix =
      !video.youtubeId &&
      (!video.url ||
        video.url === 'C++' ||
        (video.url.includes('youtube') && !extractYouTubeId(video.url)));

    if (needsFix) {
      console.log('⚠️  This video needs fixing!');

      if (providedUrl) {
        const youtubeId = extractYouTubeId(providedUrl);
        if (!youtubeId) {
          console.error('❌ Invalid YouTube URL provided.');
          await prisma.$disconnect();
          process.exit(1);
        }

        console.log(`\nUpdating with URL: ${providedUrl}`);
        console.log(`Extracted YouTube ID: ${youtubeId}`);

        await prisma.video.update({
          where: { id: video.id },
          data: {
            url: providedUrl,
            youtubeId: youtubeId,
            source: 'youtube',
            thumbnail: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
          },
        });

        console.log('✅ Video updated successfully!\n');
      } else {
        console.log('💡 To fix this video, run:');
        console.log(
          `   node scripts/fix-cpp-video.js https://www.youtube.com/watch?v=YOUR_VIDEO_ID\n`
        );
      }
    } else {
      console.log('✅ This video appears to have valid data.\n');
    }
  }

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });

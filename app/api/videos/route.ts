import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import cloudinary from '@/lib/cloudinary';

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]+)/,
    /(?:youtu\.be\/)([\w-]+)/,
    /(?:youtube\.com\/embed\/)([\w-]+)/,
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }
  return null;
}

export async function POST(req: NextRequest) {
  const { userId } = await requireAuth(['ADMIN']);
  const formData = await req.formData();

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const source = formData.get('source') as string; // 'upload' or 'youtube'

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  try {
    let videoData: any = {
      title,
      description: description || null,
      uploadedBy: userId,
    };

    if (source === 'youtube') {
      const youtubeUrl = formData.get('youtubeUrl') as string;
      if (!youtubeUrl) {
        return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });
      }
      const youtubeId = extractYouTubeId(youtubeUrl);
      if (!youtubeId) {
        return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
      }
      videoData = {
        ...videoData,
        url: youtubeUrl,
        source: 'youtube',
        youtubeId,
        cloudinaryId: null,
        thumbnail: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
      };
    } else {
      // Cloudinary upload
      const file = formData.get('file') as File;
      if (!file) {
        return NextResponse.json({ error: 'Video file is required' }, { status: 400 });
      }
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json({ error: 'Video must be less than 50MB' }, { status: 400 });
      }
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'video',
            folder: 'amentality/videos',
            use_filename: true,
            unique_filename: true,
            overwrite: true,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });
      const { public_id, secure_url } = uploadResult as any;
      videoData = {
        ...videoData,
        url: secure_url,
        source: 'cloudinary',
        cloudinaryId: public_id,
        youtubeId: null,
      };
    }

    const video = await prisma.video.create({ data: videoData });
    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to add video' }, { status: 500 });
  }
}

export async function GET() {
  await requireAuth();
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: 'desc' },
    include: { uploader: { select: { name: true } } },
  });
  return NextResponse.json(videos);
}
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import cloudinary from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(['ADMIN']);
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!file || !title) {
      return NextResponse.json(
        { error: 'File and title are required' },
        { status: 400 }
      );
    }

    // ✅ Change: Increased from 100MB to 50MB (or whatever you want)
    // Max 50MB for this specific check (you can adjust)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Video file must be less than 50MB' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'File must be a video' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary with chunked upload for large files
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'amentality/videos',
          use_filename: true,
          unique_filename: true,
          overwrite: true,
          // ✅ Add this for better handling of large files
          chunk_size: 6000000, // 6MB chunks (Cloudinary recommended)
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const { public_id, secure_url } = uploadResult as any;

    const video = await prisma.video.create({
      data: {
        title,
        description,
        cloudinaryId: public_id,
        url: secure_url,
        uploadedBy: userId,
      },
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload video: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await requireAuth();

    const videos = await prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(videos);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
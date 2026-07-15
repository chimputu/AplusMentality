import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import cloudinary from '@/lib/cloudinary';

// Helper: Extract YouTube ID from URL
function extractYouTubeId(url: string): string | null {
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

// Helper: Get YouTube thumbnail
function getYouTubeThumbnail(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

// GET - List all videos
export async function GET() {
  try {
    await requireAuth();

    const videos = await prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
          select: { 
            id: true,
            name: true, 
            email: true,
          },
        },
        lessons: {
          select: {
            id: true,
            title: true,
            moduleId: true,
          },
        },
      },
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

// POST - Create a new video (Admin only)
export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(['ADMIN']);
    const formData = await req.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const source = formData.get('source') as string; // 'upload' or 'youtube'

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!source) {
      return NextResponse.json(
        { error: 'Source type is required (upload or youtube)' },
        { status: 400 }
      );
    }

    let videoData: any = {
      title,
      description: description || null,
      uploadedBy: userId,
      source,
    };

    // Handle YouTube URL
    if (source === 'youtube') {
      const youtubeUrl = formData.get('youtubeUrl') as string;
      
      if (!youtubeUrl) {
        return NextResponse.json(
          { error: 'YouTube URL is required' },
          { status: 400 }
        );
      }

      const youtubeId = extractYouTubeId(youtubeUrl);
      if (!youtubeId) {
        return NextResponse.json(
          { error: 'Invalid YouTube URL' },
          { status: 400 }
        );
      }

      videoData = {
        ...videoData,
        url: youtubeUrl,
        youtubeId,
        cloudinaryId: null,
        thumbnail: getYouTubeThumbnail(youtubeId),
      };
    } 
    // Handle Cloudinary Upload
    else if (source === 'upload') {
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json(
          { error: 'Video file is required' },
          { status: 400 }
        );
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Video must be less than 50MB' },
          { status: 400 }
        );
      }

      // Validate file type
      const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid video format. Please upload MP4, WebM, or OGG.' },
          { status: 400 }
        );
      }

      try {
        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'video',
              folder: 'amentality/videos',
              use_filename: true,
              unique_filename: true,
              overwrite: true,
              transformation: [
                { quality: 'auto' },
                { fetch_format: 'auto' },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(buffer);
        });

        const { public_id, secure_url, duration } = uploadResult as any;

        videoData = {
          ...videoData,
          url: secure_url,
          cloudinaryId: public_id,
          youtubeId: null,
          duration: Math.round(duration || 0),
          thumbnail: null, // Cloudinary can generate thumbnails
        };
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError);
        return NextResponse.json(
          { error: 'Failed to upload video to Cloudinary' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid source type. Must be "upload" or "youtube"' },
        { status: 400 }
      );
    }

    // Save video to database
    const video = await prisma.video.create({
      data: videoData,
      include: {
        uploader: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to add video' },
      { status: 500 }
    );
  }
}

// PUT - Update a video (Admin only)
export async function PUT(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);
    const body = await req.json();
    const { id, title, description, url, thumbnail, youtubeId } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Check if video exists
    const existingVideo = await prisma.video.findUnique({
      where: { id },
    });

    if (!existingVideo) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    const video = await prisma.video.update({
      where: { id },
      data: {
        title,
        description,
        url,
        thumbnail,
        youtubeId,
      },
      include: {
        uploader: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json(video);
  } catch (error: any) {
    console.error('Error updating video:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a video (Admin only)
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Find the video
    const video = await prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Delete from Cloudinary if it's a Cloudinary video
    if (video.source === 'cloudinary' && video.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(video.cloudinaryId, {
          resource_type: 'video',
        });
        console.log(`🗑️ Deleted video from Cloudinary: ${video.cloudinaryId}`);
      } catch (cloudinaryError) {
        console.error('Cloudinary delete error:', cloudinaryError);
        // Continue with database deletion even if Cloudinary fails
      }
    }

    // Delete from database
    await prisma.video.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Video deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting video:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}
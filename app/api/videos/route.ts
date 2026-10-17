import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import cloudinary from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

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

function getYouTubeThumbnail(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const courseId = searchParams.get('courseId');

    const institutionId =
        searchParams.get('institutionId') || searchParams.get('institution');

    const universityId =
        searchParams.get('universityId') || searchParams.get('university');

    const where: any = {};

    if (courseId) where.courseId = courseId;

    if (institutionId) {
      where.course = {
        programme: {
          institutionId,
        },
      };
    } else if (universityId) {
      where.course = {
        universityId,
      };
    }

    const videos = await prisma.video.findMany({
      where,
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
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            university: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            programme: {
              select: {
                id: true,
                name: true,
                institutionId: true,
                institution: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    shortName: true,
                  },
                },
              },
            },
            year: true,
            period: true,
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

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(['ADMIN']);
    const formData = await req.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const source = formData.get('source') as string;
    const order = formData.get('order')
        ? parseInt(formData.get('order') as string)
        : null;

    const institutionId = formData.get('institutionId') as string;
    const universityId = formData.get('universityId') as string;
    const programmeId = formData.get('programmeId') as string;

    const year = formData.get('year')
        ? parseInt(formData.get('year') as string)
        : 1;

    const period = (formData.get('period') as string) || null;

    const courseMode = (formData.get('courseMode') as string) || 'existing';
    const existingCourseId = formData.get('courseId') as string;
    const newCourseCode = formData.get('newCourseCode') as string;
    const newCourseTitle = formData.get('newCourseTitle') as string;

    if (!title) {
      return NextResponse.json(
          { error: 'Title is required' },
          { status: 400 }
      );
    }

    if (!source) {
      return NextResponse.json(
          { error: 'Source type is required' },
          { status: 400 }
      );
    }

    if (!programmeId) {
      return NextResponse.json(
          { error: 'Programme is required' },
          { status: 400 }
      );
    }

    const programme = await prisma.programme.findUnique({
      where: { id: programmeId },
      select: {
        id: true,
        institutionId: true,
        universityId: true,
      },
    });

    if (!programme) {
      return NextResponse.json(
          { error: 'Programme not found' },
          { status: 404 }
      );
    }

    if (institutionId && programme.institutionId !== institutionId) {
      return NextResponse.json(
          { error: 'Programme does not belong to the selected institution' },
          { status: 400 }
      );
    }

    let resolvedCourseId: string | null = null;

    if (courseMode === 'existing') {
      if (!existingCourseId) {
        return NextResponse.json(
            { error: 'Course is required' },
            { status: 400 }
        );
      }

      const existingCourse = await prisma.course.findFirst({
        where: {
          id: existingCourseId,
          programmeId,
        },
        select: {
          id: true,
        },
      });

      if (!existingCourse) {
        return NextResponse.json(
            { error: 'Selected course does not belong to the selected programme' },
            { status: 400 }
        );
      }

      resolvedCourseId = existingCourse.id;
    } else if (courseMode === 'new') {
      if (!newCourseCode || !newCourseTitle) {
        return NextResponse.json(
            { error: 'New course code and title are required' },
            { status: 400 }
        );
      }

      const createdCourse = await prisma.course.create({
        data: {
          code: newCourseCode,
          title: newCourseTitle,
          universityId: universityId || programme.universityId || null,
          programmeId,
          year,
          period,
          createdBy: userId,
          isPublished: true,
        },
        select: {
          id: true,
        },
      });

      resolvedCourseId = createdCourse.id;
    } else {
      return NextResponse.json(
          { error: 'Invalid course mode' },
          { status: 400 }
      );
    }

    let videoData: any = {
      title,
      description: description || null,
      uploadedBy: userId,
      source,
      courseId: resolvedCourseId,
      order,
    };

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
    } else if (source === 'upload') {
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json(
            { error: 'Video file is required' },
            { status: 400 }
        );
      }

      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json(
            { error: 'Video must be less than 50MB' },
            { status: 400 }
        );
      }

      const validTypes = [
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/quicktime',
      ];

      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
            { error: 'Invalid video format. Please upload MP4, WebM, OGG, or MOV.' },
            { status: 400 }
        );
      }

      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadResult = await new Promise<any>((resolve, reject) => {
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

        const { public_id, secure_url, duration } = uploadResult;

        videoData = {
          ...videoData,
          url: secure_url,
          cloudinaryId: public_id,
          youtubeId: null,
          duration: Math.round(duration || 0),
          thumbnail: null,
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

    const video = await prisma.video.create({
      data: videoData,
      include: {
        uploader: {
          select: { name: true, email: true },
        },
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            programme: {
              select: {
                id: true,
                name: true,
                institution: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
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

export async function PUT(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);

    const body = await req.json();

    const {
      id,
      title,
      description,
      url,
      thumbnail,
      youtubeId,
      courseId,
      order,
    } = body;

    if (!id) {
      return NextResponse.json(
          { error: 'Video ID is required' },
          { status: 400 }
      );
    }

    const existingVideo = await prisma.video.findUnique({
      where: { id },
    });

    if (!existingVideo) {
      return NextResponse.json(
          { error: 'Video not found' },
          { status: 404 }
      );
    }

    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true },
      });

      if (!course) {
        return NextResponse.json(
            { error: 'Course not found' },
            { status: 404 }
        );
      }
    }

    const video = await prisma.video.update({
      where: { id },
      data: {
        title,
        description,
        url,
        thumbnail,
        youtubeId,
        courseId,
        order:
            order !== undefined && order !== null
                ? parseInt(String(order))
                : undefined,
      },
      include: {
        uploader: {
          select: { name: true, email: true },
        },
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            programme: {
              select: {
                id: true,
                name: true,
                institution: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
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

    const video = await prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      return NextResponse.json(
          { error: 'Video not found' },
          { status: 404 }
      );
    }

    if (
        (video.source === 'upload' || video.source === 'cloudinary') &&
        video.cloudinaryId
    ) {
      try {
        await cloudinary.uploader.destroy(video.cloudinaryId, {
          resource_type: 'video',
        });
      } catch (cloudinaryError) {
        console.error('Cloudinary delete error:', cloudinaryError);
      }
    }

    await prisma.video.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully',
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
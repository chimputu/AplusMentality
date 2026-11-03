// app/api/admin/uploads/[id]/tag/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT — tag a file (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(['ADMIN', 'SUPER_ADMIN']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const {
      universityId,
      programmeId,
      year,
      period,
      courseMode, // 'existing' | 'new'
      courseId: existingCourseId,
      newCourseCode,
      newCourseTitle,
      contentType,
      order,
    } = body;

    if (!universityId || !programmeId || !year) {
      return NextResponse.json(
        { error: 'University, programme, and year are required' },
        { status: 400 }
      );
    }

    // Find the pending upload
    const upload = await prisma.pendingUpload.findUnique({
      where: { id },
    });

    if (!upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
    }

    let courseId: string;

    if (courseMode === 'new') {
      if (!newCourseCode || !newCourseTitle) {
        return NextResponse.json(
          { error: 'Course code and title are required for new course' },
          { status: 400 }
        );
      }

      // Create new course
      const course = await prisma.course.create({
        data: {
          code: newCourseCode,
          title: newCourseTitle,
          programmeId,
          year: parseInt(String(year)),
          period: period || '',
          createdBy: auth.userId,
          isPublished: true,
        },
      });
      courseId = course.id;
    } else {
      if (!existingCourseId) {
        return NextResponse.json(
          { error: 'Course ID is required for existing course mode' },
          { status: 400 }
        );
      }
      courseId = existingCourseId;
    }

    // Update the pending upload
    const updatedUpload = await prisma.pendingUpload.update({
      where: { id },
      data: {
        courseId,
        status: 'TAGGED',
        contentType,
        order: order ? parseInt(String(order)) : null,
        taggedAt: new Date(),
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
    });

    // Create the actual content row based on contentType
    const title = upload.originalName.replace(/\.[^/.]+$/, ''); // Remove extension

    // Normalize file type to a category name for consistent storage
    function normalizeFileType(ext: string, mimeType: string): string {
      if (mimeType === 'application/pdf' || ext === 'pdf') return 'pdf';
      if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext.toLowerCase())) return 'image';
      if (mimeType.includes('wordprocessingml') || ext === 'docx' || ext === 'doc') return 'docx';
      return ext || 'raw';
    }

    const normalizedType = normalizeFileType(upload.fileType, upload.mimeType);

    switch (contentType) {
      case 'lecture_slide':
      case 'tutorial':
        await prisma.lectureSlide.create({
          data: {
            title,
            fileUrl: upload.url,
            contentType: normalizedType,
            order: order ? parseInt(String(order)) : 0,
            courseId,
            createdBy: auth.userId,
          },
        });
        break;

      case 'video':
        await prisma.video.create({
          data: {
            title,
            url: upload.url,
            uploadedBy: auth.userId,
          },
        });
        break;

      case 'past_paper':
        await prisma.pastPaper.create({
          data: {
            title,
            fileUrl: upload.url,
            fileType: normalizedType,
            fileSize: upload.fileSize,
            createdBy: auth.userId,
          },
        });
        break;

      case 'quiz':
        await prisma.quiz.create({
          data: {
            title,
            embedUrl: upload.url,
            formUrl: upload.url,
            fileUrl: upload.url,
            contentType,
            createdBy: auth.userId,
          },
        });
        break;

      case 'test':
        await prisma.test.create({
          data: {
            title,
            embedUrl: upload.url,
            formUrl: upload.url,
            fileUrl: upload.url,
            contentType,
            createdBy: auth.userId,
          },
        });
        break;

      case 'assignment':
        await prisma.assignment.create({
          data: {
            title,
            embedUrl: upload.url,
            formUrl: upload.url,
            fileUrl: upload.url,
            contentType,
            createdBy: auth.userId,
          },
        });
        break;
    }

    return NextResponse.json(updatedUpload);
  } catch (error: any) {
    console.error('[admin/uploads/[id]/tag PUT] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to tag upload' },
      { status: 500 }
    );
  }
}

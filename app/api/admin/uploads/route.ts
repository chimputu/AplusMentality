// app/api/admin/uploads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import cloudinary from '@/lib/cloudinary';

// GET — list all pending uploads (admin only)
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(['ADMIN', 'SUPER_ADMIN']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status) where.status = status;

    const uploads = await prisma.pendingUpload.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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

    return NextResponse.json(uploads);
  } catch (error) {
    console.error('[admin/uploads GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch uploads' },
      { status: 500 }
    );
  }
}

// POST — upload a file to staging area (admin only)
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(['ADMIN', 'SUPER_ADMIN']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // File size limit: 100 MB
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 100 MB limit' },
        { status: 400 }
      );
    }

    // Detect resource type for Cloudinary
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const resourceType = isPdf || isImage ? 'image' : isVideo ? 'video' : 'raw';

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract suggested course code from filename
    const codeMatch = file.name.match(/([A-Z]{2,4}\s*\d{3})/i);
    const suggestedCode = codeMatch ? codeMatch[1].trim() : null;

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'aplus/pending',
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error) {
              console.error('[upload] Cloudinary error:', error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        )
        .end(buffer);
    });

    if (!result || !result.secure_url) {
      return NextResponse.json(
        { error: 'Upload succeeded but no URL returned' },
        { status: 500 }
      );
    }

    // Get file extension
    const ext = file.name.split('.').pop() || '';

    const upload = await prisma.pendingUpload.create({
      data: {
        filename: result.public_id,
        originalName: file.name,
        url: result.secure_url,
        fileType: ext,
        mimeType: file.type,
        fileSize: file.size,
        suggestedCode,
        status: 'UNTAGGED',
        uploadedBy: auth.userId,
      },
    });

    return NextResponse.json(upload, { status: 201 });
  } catch (error: any) {
    console.error('[admin/uploads POST] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

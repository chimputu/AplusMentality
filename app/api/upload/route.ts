// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import cloudinary from '@/lib/cloudinary';
import { prisma } from '@/lib/prisma';
import { createRateLimit } from '@/lib/rate-limit';

// SECURITY: Server-side upload limits
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm'];

// Server-selected folders — client cannot choose arbitrary folders
const ALLOWED_FOLDERS = ['assessments', 'quiz-answers', 'assignment-answers', 'lecture-slides', 'past-papers'];

// Rate limiter: 10 uploads per minute per user
const uploadLimiter = createRateLimit({ maxRequests: 10, windowMs: 60000 });

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Authenticate via Clerk
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Rate limiting
    const rateLimitResult = await uploadLimiter(clerkId);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many uploads. Please try again later.' },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folderParam = (formData.get('folder') as string) || 'assessments';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // SECURITY: Validate file size (server-side)
    if (file.size === 0) {
      return NextResponse.json({ error: 'Empty file' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // SECURITY: Validate MIME type (do not trust client-only)
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    // SECURITY: Validate file extension
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: 'Unsupported file extension' }, { status: 400 });
    }

    // SECURITY: Server-selects the folder — reject client-controlled arbitrary folders
    const folder = ALLOWED_FOLDERS.includes(folderParam) ? folderParam : 'assessments';

    // Detect resource type for Cloudinary
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    const resourceType = isPdf || isImage ? 'image' : 'raw';

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `aplus/${folder}`,
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error) {
              console.error('[upload] Cloudinary error:', error.message);
              reject(error);
            } else {
              resolve(result);
            }
          }
        )
        .end(buffer);
    });

    if (!result || !result.secure_url) {
      console.error('[upload] Cloudinary returned no secure_url');
      return NextResponse.json(
        { error: 'Upload failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
      format: result.format,
    });
  } catch (error: any) {
    console.error('[upload] Error:', error.message);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
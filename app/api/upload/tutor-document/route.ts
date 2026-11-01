import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';
import { createRateLimit } from '@/lib/rate-limit';

// SECURITY: Server-side upload limits for tutor documents
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
// Server-selected folders — client cannot choose arbitrary folders
const ALLOWED_FOLDERS = ['tutor-applications', 'tutor-documents'];

// Rate limiter: 5 tutor document uploads per minute per user
const tutorDocLimiter = createRateLimit({ maxRequests: 5, windowMs: 60000 });

export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthUser();
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Rate limiting
    const rateLimitResult = await tutorDocLimiter(authResult.user.clerkId);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many uploads. Please try again later.' },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folderParam = (formData.get('folder') as string) || 'tutor-applications';

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

    // SECURITY: Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    // SECURITY: Validate file extension
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: 'Unsupported file extension' }, { status: 400 });
    }

    // SECURITY: Server-selects the folder — reject client-controlled arbitrary folders
    const folder = ALLOWED_FOLDERS.includes(folderParam) ? folderParam : 'tutor-applications';

    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    const resourceType = isPdf || isImage ? 'image' : 'raw';

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `aplusmentality/${folder}/${authResult.user.id}`,
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error) {
              console.error('[tutor-upload] Cloudinary error:', error);
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

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    console.error('[tutor-upload] Error:', message);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}

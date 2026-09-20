// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    // ✅ API-safe auth — returns null instead of redirecting
    const authResult = await getAuthUser();
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // ⭐ Detect resource type — PDFs must be 'image' for Cloudinary preview + transformations
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    const resourceType = isPdf || isImage ? 'image' : 'raw';

    console.log('[upload] File:', {
      name: file.name,
      type: file.type,
      size: file.size,
      resourceType,
    });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'aplus/assessments',
            resource_type: resourceType,
            // ⭐ Preserve the original filename for easier debugging
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

    // ⭐ Verify the upload actually succeeded
    if (!result || !result.secure_url) {
      console.error('[upload] Cloudinary returned no secure_url:', result);
      return NextResponse.json(
        { error: 'Upload succeeded but no URL returned' },
        { status: 500 }
      );
    }

    console.log('[upload] Success:', {
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
      format: result.format,
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
      format: result.format,
    });
  } catch (error: any) {
    console.error('[upload] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
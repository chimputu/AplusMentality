import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthUser();
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'tutor-applications';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    const resourceType = isPdf || isImage ? 'image' : 'raw';

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<any>((resolve, reject) => {
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
  } catch (error: any) {
    console.error('[tutor-upload] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

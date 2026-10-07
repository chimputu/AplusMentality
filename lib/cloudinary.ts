import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export async function uploadTutorPhoto(buffer: Buffer, publicId: string) {
  return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'tutors/profiles',
        public_id: publicId,
        overwrite: true,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload failed'));
        } else {
          resolve({ secure_url: result.secure_url, public_id: result.public_id });
        }
      }
    );
    uploadStream.end(buffer);
  });
}

export async function deleteTutorPhoto(publicId: string) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Failed to delete Cloudinary asset:', error);
    // Ignore errors if the asset is already gone
  }
}
'use client';

import { ImageUploader } from '@/components/tutor-application/image-uploader';

interface Props {
  formData: any;
  updateField: (field: string, value: any) => void;
}

export default function Step3Identity({ formData, updateField }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          We need to verify your identity. All documents are encrypted and only visible to administrators.
        </p>

        {/* Profile Photo */}
        <div className="mb-8">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Profile Photo
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Upload a clear, professional photo of your face. This will appear on your public tutor profile.
          </p>
          <ImageUploader
            label="Profile Photo"
            description="Square image (1:1), min 400x400px, max 5 MB. JPG, PNG, or WebP."
            value={formData.profilePhotoUrl}
            onChange={(url, publicId) => {
              updateField('profilePhotoUrl', url);
              updateField('profilePhotoPublicId', publicId);
            }}
            folder="tutor-applications/profile-photos"
            aspectRatio="square"
            maxSizeMB={5}
          />
        </div>

        {/* NRC */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
            National Registration Card (Green Card)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Upload clear photos of both sides of your NRC.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageUploader
              label="Front Side"
              description="Accepted: JPG, PNG, WebP · Max 5 MB"
              value={formData.nrcFrontUrl}
              onChange={(url, publicId) => {
                updateField('nrcFrontUrl', url);
                updateField('nrcFrontPublicId', publicId);
              }}
              folder="tutor-applications/nrc-front"
              aspectRatio="card"
              maxSizeMB={5}
            />

            <ImageUploader
              label="Back Side"
              description="Accepted: JPG, PNG, WebP · Max 5 MB"
              value={formData.nrcBackUrl}
              onChange={(url, publicId) => {
                updateField('nrcBackUrl', url);
                updateField('nrcBackPublicId', publicId);
              }}
              folder="tutor-applications/nrc-back"
              aspectRatio="card"
              maxSizeMB={5}
            />
          </div>

          {/* NRC Number */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              NRC Number <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.nrcNumber || ''}
              onChange={(e) => updateField('nrcNumber', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="123456/78/9"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Format: 123456/78/9
            </p>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            🔒 Your identity documents are encrypted and only visible to admins reviewing your application.
          </p>
        </div>
      </div>
    </div>
  );
}

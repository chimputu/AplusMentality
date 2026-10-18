'use client';

import { useState } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';

interface Props {
  formData: any;
  updateField: (field: string, value: any) => void;
}

export default function Step4Documents({ formData, updateField }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('File type not allowed. Please upload PDF, JPG, PNG, or WebP.');
      return;
    }

    // Validate file size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be under 5 MB.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData_upload = new FormData();
      formData_upload.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData_upload,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const data = await res.json();
      updateField('cvUrl', data.url);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          CV / Resume
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Upload your CV in PDF, JPG, PNG, or WebP format (max 5 MB)
        </p>

        {uploadError && (
          <div className="mb-2 text-sm text-red-600 dark:text-red-400">{uploadError}</div>
        )}

        {formData.cvUrl ? (
          <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs">
                CV uploaded
              </span>
            </div>
            <button
              type="button"
              onClick={() => updateField('cvUrl', '')}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition">
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                <span className="text-sm text-gray-500">Uploading...</span>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Click to upload your CV
                </span>
              </>
            )}
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>
    </div>
  );
}

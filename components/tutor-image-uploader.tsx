'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, X, Trash2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

interface TutorImageUploaderProps {
  tutorId: string;
  currentUrl?: string | null;
  onUploaded?: (url: string) => void;
}

export default function TutorImageUploader({
  tutorId,
  currentUrl,
  onUploaded,
}: TutorImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeUrl = previewUrl || currentUrl;

  const validateFile = useCallback((file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only JPG, PNG, or WebP images are allowed');
      return false;
    }
    if (file.size > MAX_SIZE) {
      toast.error('Image must be under 5 MB');
      return false;
    }
    return true;
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!validateFile(file)) {
        setPreviewUrl(null);
        return;
      }

      // Show preview immediately
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setProgress(0);
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tutorId', tutorId);

        // Simulate progress
        const progressInterval = setInterval(() => {
          setProgress((p) => Math.min(p + 10, 90));
        }, 200);

        const res = await fetch('/api/tutors/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);
        setProgress(100);

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Upload failed' }));
          throw new Error(err.error || 'Upload failed');
        }

        const result = await res.json();
        toast.success('Photo updated successfully');
        onUploaded?.(result.url);

        // Clean up object URL after short delay
        setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
          setPreviewUrl(null);
        }, 1000);
      } catch (err: any) {
        console.error('Upload error:', err);
        toast.error(err.message || 'Failed to upload photo');
        URL.revokeObjectURL(objectUrl);
        setPreviewUrl(null);
      } finally {
        setUploading(false);
        setProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [tutorId, validateFile, onUploaded]
  );

  const handleRemove = useCallback(async () => {
    if (!confirm('Are you sure you want to remove this photo?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/tutors/upload?tutorId=${tutorId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Delete failed' }));
        throw new Error(err.error || 'Delete failed');
      }

      toast.success('Photo removed');
      setPreviewUrl(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to remove photo');
    } finally {
      setDeleting(false);
    }
  }, [tutorId]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        {/* Avatar display */}
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
          {activeUrl ? (
            <Image
              src={activeUrl}
              alt="Tutor profile"
              width={128}
              height={128}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600">
              <Camera className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
          )}
        </div>

        {/* Upload overlay */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || deleting}
          className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          ) : (
            <Camera className="w-8 h-8 text-white" />
          )}
        </button>

        {/* Progress bar */}
        {uploading && progress > 0 && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24">
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || deleting}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </button>

        {activeUrl && !previewUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading || deleting}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? 'Removing...' : 'Remove'}
          </button>
        )}

        {previewUrl && (
          <button
            type="button"
            onClick={() => setPreviewUrl(null)}
            disabled={uploading}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        JPG, PNG, or WebP. Max 5 MB.
      </p>
    </div>
  );
}

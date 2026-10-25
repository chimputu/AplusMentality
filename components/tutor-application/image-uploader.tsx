'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploaderProps {
  label: string;
  description?: string;
  value?: string;         // Cloudinary URL
  onChange: (url: string, publicId: string) => void;
  folder: string;         // e.g., 'tutor-applications/nrc'
  aspectRatio?: 'square' | 'card' | 'free';
  maxSizeMB?: number;
}

export function ImageUploader({
  label,
  description,
  value,
  onChange,
  folder,
  aspectRatio = 'free',
  maxSizeMB = 5,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(!!value);

  async function handleFile(file: File) {
    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File must be under ${maxSizeMB} MB`);
      return;
    }

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      .includes(file.type)) {
      toast.error('Only JPG, PNG, WebP, or PDF allowed');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await fetch('/api/upload/tutor-document', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      onChange(data.url, data.publicId);
      setUploaded(true);
      toast.success('Uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {uploaded && value ? (
        <div className="relative border border-border rounded-lg overflow-hidden">
          {value.endsWith('.pdf') ? (
            <div className="p-4 bg-muted text-center">
              <p className="text-sm text-muted-foreground">PDF uploaded</p>
            </div>
          ) : (
            <div className={`relative w-full ${
              aspectRatio === 'square' ? 'aspect-square max-w-[200px]' :
              aspectRatio === 'card' ? 'aspect-[1.6/1]' :
              'aspect-video'
            }`}>
              <Image
                src={value}
                alt={label}
                fill
                sizes="(max-width: 200px) 100vw, 200px"
                className="object-cover"
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setUploaded(false);
              onChange('', '');
            }}
            className="absolute top-2 right-2 bg-card rounded-full p-1 shadow hover:bg-muted  transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className={`
          flex flex-col items-center justify-center 
          border-2 border-dashed border-border rounded-lg p-6 cursor-pointer 
          hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}>
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium text-foreground">
                Click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                Max {maxSizeMB} MB
              </p>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      )}
    </div>
  );
}

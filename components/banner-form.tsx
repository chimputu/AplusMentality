'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBanner, updateBanner } from '@/lib/actions/banner';
import { Upload, X, Image as ImageIcon, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import ScopeSelector from '@/app/admin/banners/_components/scope-selector';
import BannerPreview from '@/app/admin/banners/_components/banner-preview';

interface BannerFormData {
  title: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl: string;
  variant: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER' | 'PROMO';
  placement: 'HOMEPAGE' | 'DASHBOARD' | 'BOTH';
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  priority: number;
  scope: 'GLOBAL' | 'ALL' | 'SPECIFIC';
  institutionIds: string[];
}

const initialFormData: BannerFormData = {
  title: '',
  message: '',
  ctaLabel: '',
  ctaUrl: '',
  imageUrl: '',
  variant: 'INFO',
  placement: 'HOMEPAGE',
  startsAt: new Date().toISOString().slice(0, 16),
  endsAt: '',
  isActive: true,
  priority: 0,
  scope: 'GLOBAL',
  institutionIds: [],
};

const variantStyles: Record<string, { bg: string; border: string; text: string }> = {
  INFO: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-l-blue-500',
    text: 'text-blue-800 dark:text-blue-200',
  },
  SUCCESS: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    border: 'border-l-green-500',
    text: 'text-green-800 dark:text-green-200',
  },
  WARNING: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    border: 'border-l-amber-500',
    text: 'text-amber-800 dark:text-amber-200',
  },
  DANGER: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    border: 'border-l-red-500',
    text: 'text-red-800 dark:text-red-200',
  },
  PROMO: {
    bg: 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30',
    border: 'border-l-purple-500',
    text: 'text-purple-800 dark:text-purple-200',
  },
};

interface BannerFormProps {
  bannerId?: string;
  initialData?: BannerFormData;
  isSuperAdmin?: boolean;
}

export default function BannerForm({ bannerId, initialData, isSuperAdmin = false }: BannerFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<BannerFormData>(initialData || initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(initialData?.imageUrl || '');
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleChange = (field: keyof BannerFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type', { description: 'Only JPG, PNG, or WebP images are allowed' });
      setError('Only JPG, PNG, or WebP images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', { description: 'Image must be under 5 MB' });
      setError('Image must be under 5 MB');
      return;
    }

    setUploadingImage(true);
    setError('');

    // Show immediate local preview
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('folder', 'banners');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errData.error || 'Upload failed');
      }
      const data = await res.json();
      handleChange('imageUrl', data.url);
      setImagePreview(data.url);
      toast.success('Image uploaded', { description: 'Your banner image is ready' });
    } catch (err: any) {
      console.error('[banner-form] Upload error:', err);
      setImagePreview('');
      setError(err.message || 'Failed to upload image');
      toast.error('Upload failed', { description: err.message || 'Could not upload image' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        startsAt: new Date(formData.startsAt).toISOString(),
        endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : null,
        institutionIds: formData.scope === 'SPECIFIC' ? formData.institutionIds : [],
      };

      const result = bannerId
        ? await updateBanner(bannerId, payload)
        : await createBanner(payload);

      if (result && result.success === false) {
        const errorMsg = result.error || 'Failed to save banner';
        setError(errorMsg);
        toast.error('Failed to save banner', { description: errorMsg });
        return;
      }

      toast.success(bannerId ? 'Banner updated' : 'Banner created', {
        description: bannerId
          ? 'The banner has been updated successfully'
          : 'The banner will appear shortly',
      });
      router.push('/admin/banners');
    } catch (err: any) {
      console.error('[banner-form] Submit error:', err);
      const errorMsg = err.message || 'Failed to save banner';
      setError(errorMsg);
      toast.error('Failed to save banner', { description: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {bannerId ? 'Edit Banner' : 'New Banner'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {bannerId ? 'Update the banner details' : 'Create a new announcement banner'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-card rounded-xl border border-border p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                minLength={3}
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Midterm exams this week"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Message *
              </label>
              <textarea
                required
                minLength={3}
                rows={3}
                value={formData.message}
                onChange={(e) => handleChange('message', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Exams will be held from Monday to Friday..."
              />
            </div>

            {/* Variant */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Variant
              </label>
              <div className="flex gap-2 flex-wrap">
                {(['INFO', 'SUCCESS', 'WARNING', 'DANGER', 'PROMO'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleChange('variant', v)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition ${
                      formData.variant === v
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-border text-muted-foreground hover:border-foreground'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Placement */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Placement
              </label>
              <div className="flex gap-2">
                {(['HOMEPAGE', 'DASHBOARD', 'BOTH'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleChange('placement', p)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                      formData.placement === p
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-border text-muted-foreground hover:border-foreground'
                    }`}
                  >
                    {p === 'HOMEPAGE' ? 'Homepage' : p === 'DASHBOARD' ? 'Dashboard' : 'Both'}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Audience - Scope */}
            {isSuperAdmin && (
              <div className="border-t border-border pt-4">
                <ScopeSelector
                  scope={formData.scope}
                  institutionIds={formData.institutionIds}
                  onScopeChange={(scope) => {
                    handleChange('scope', scope);
                    if (scope !== 'SPECIFIC') {
                      handleChange('institutionIds', []);
                    }
                  }}
                  onInstitutionIdsChange={(ids) => handleChange('institutionIds', ids)}
                />
              </div>
            )}

            {/* CTA */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  CTA Label
                </label>
                <input
                  type="text"
                  value={formData.ctaLabel}
                  onChange={(e) => handleChange('ctaLabel', e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Learn more"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  CTA URL
                </label>
                <input
                  type="text"
                  value={formData.ctaUrl}
                  onChange={(e) => handleChange('ctaUrl', e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="/exams or https://..."
                />
              </div>
            </div>

            {/* Image */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Banner Image (optional)
              </label>
              {imagePreview && !uploadingImage ? (
                <div className="relative border border-border rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Banner preview"
                    className="w-full h-32 object-cover"
                  />
                  {formData.imageUrl && (
                    <div className="absolute top-2 left-2 bg-green-500 text-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium">
                      <Check className="w-3 h-3" /> Uploaded
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      handleChange('imageUrl', '');
                      setImagePreview('');
                    }}
                    className="absolute top-2 right-2 bg-card rounded-full p-1 shadow hover:bg-muted  transition"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg px-4 py-3 text-center hover:border-foreground transition cursor-pointer ${
                  uploadingImage ? 'opacity-50 pointer-events-none' : ''
                }`}>
                  {uploadingImage ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                      <span className="text-sm text-muted-foreground">Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Click to upload image</span>
                      <span className="text-xs text-muted-foreground">JPG, PNG, WebP · Max 5 MB</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Starts At
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startsAt}
                  onChange={(e) => handleChange('startsAt', e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Ends At (optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.endsAt}
                  onChange={(e) => handleChange('endsAt', e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Priority (higher = shown first)
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => handleChange('priority', parseInt(e.target.value) || 0)}
                className="w-full border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleChange('isActive', !formData.isActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  formData.isActive ? 'bg-green-600' : 'bg-muted '
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-background transition ${
                    formData.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-foreground">Active</span>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition"
              >
                {loading ? 'Saving...' : bannerId ? 'Update Banner' : 'Create Banner'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted  transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview */}
        <div>
          <BannerPreview
            title={formData.title}
            message={formData.message}
            ctaLabel={formData.ctaLabel}
            imageUrl={formData.imageUrl}
            variant={formData.variant}
            placement={formData.placement}
            scope={formData.scope}
            institutionIds={formData.institutionIds}
            isActive={formData.isActive}
            priority={formData.priority}
          />
        </div>
      </div>
    </div>
  );
}

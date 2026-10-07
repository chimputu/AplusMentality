'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBanner, updateBanner } from '@/lib/actions/banner';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
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
}

export default function BannerForm({ bannerId, initialData }: BannerFormProps) {
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
      setError('Only JPG, PNG, or WebP images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('folder', 'banners');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      handleChange('imageUrl', data.secure_url);
      setImagePreview(data.secure_url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
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

      if (bannerId) {
        await updateBanner(bannerId, payload);
      } else {
        await createBanner(payload);
      }
      router.push('/admin/banners');
    } catch (err: any) {
      setError(err.message || 'Failed to save banner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {bannerId ? 'Edit Banner' : 'New Banner'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {bannerId ? 'Update the banner details' : 'Create a new announcement banner'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                minLength={3}
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Midterm exams this week"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message *
              </label>
              <textarea
                required
                minLength={3}
                rows={3}
                value={formData.message}
                onChange={(e) => handleChange('message', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Exams will be held from Monday to Friday..."
              />
            </div>

            {/* Variant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Placement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    {p === 'HOMEPAGE' ? 'Homepage' : p === 'DASHBOARD' ? 'Dashboard' : 'Both'}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Audience - Scope */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
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

            {/* CTA */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CTA Label
                </label>
                <input
                  type="text"
                  value={formData.ctaLabel}
                  onChange={(e) => handleChange('ctaLabel', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Learn more"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CTA URL
                </label>
                <input
                  type="text"
                  value={formData.ctaUrl}
                  onChange={(e) => handleChange('ctaUrl', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="/exams or https://..."
                />
              </div>
            </div>

            {/* Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Banner Image (optional)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-center hover:border-gray-400 transition">
                    {uploadingImage ? (
                      <span className="text-sm text-gray-500">Uploading...</span>
                    ) : imagePreview ? (
                      <div className="flex items-center justify-center gap-2">
                        <ImageIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">Image uploaded</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Upload className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">Click to upload image</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      handleChange('imageUrl', '');
                      setImagePreview('');
                    }}
                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Starts At
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startsAt}
                  onChange={(e) => handleChange('startsAt', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ends At (optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.endsAt}
                  onChange={(e) => handleChange('endsAt', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority (higher = shown first)
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => handleChange('priority', parseInt(e.target.value) || 0)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleChange('isActive', !formData.isActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  formData.isActive ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    formData.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
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
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
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

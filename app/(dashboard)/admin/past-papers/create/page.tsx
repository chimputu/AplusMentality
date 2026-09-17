// app/(dashboard)/admin/past-papers/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Loader2, FileText, Image as ImageIcon, File } from 'lucide-react';

const CATEGORIES = [
  { value: 'test', label: 'Test', icon: '📝' },
  { value: 'quiz', label: 'Quiz', icon: '❓' },
  { value: 'assignment', label: 'Assignment', icon: '📋' },
  { value: 'final_exam', label: 'Final Exam', icon: '🎓' },
];

export default function CreatePastPaperPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [fileName, setFileName] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    courseCode: '',
    year: '',
    semester: '',
    category: 'final_exam',
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setFileName(file.name);
    setFileSize(file.size);

    // Detect file type
    let detected = 'other';
    if (file.type === 'application/pdf') detected = 'pdf';
    else if (file.type.startsWith('image/')) detected = 'image';
    else if (
      file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    )
      detected = 'docx';
    setFileType(detected);

    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      setFileUrl(data.url);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setFileName('');
      setFileSize(0);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title || !fileUrl) {
      setError('Title and file are required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/past-papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          fileUrl,
          fileType,
          fileSize,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }

      router.push('/admin/past-papers');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = () => {
    if (fileType === 'pdf') return <FileText className="w-5 h-5 text-red-500" />;
    if (fileType === 'image') return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (fileType === 'docx') return <File className="w-5 h-5 text-indigo-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/admin/past-papers"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-sm mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Past Papers
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Add Past Paper
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat.value })}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition ${
                    form.category === cat.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="text-xl mb-1">{cat.icon}</div>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              placeholder="e.g. ICT411 Final Exam 2024"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              placeholder="Optional description..."
            />
          </div>

          {/* Course code + Year */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Course Code
              </label>
              <input
                type="text"
                value={form.courseCode}
                onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="e.g. ICT411"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Year
              </label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="2024"
              />
            </div>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Semester
            </label>
            <select
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select…</option>
              <option value="Semester 1">Semester 1</option>
              <option value="Semester 2">Semester 2</option>
              <option value="Final">Final</option>
              <option value="Supplementary">Supplementary</option>
            </select>
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              File (PDF, Image, or DOCX) *
            </label>

            <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg px-4 py-8 cursor-pointer hover:border-blue-500 transition">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Click to choose a file
              </span>
              <input
                type="file"
                accept=".pdf,.docx,.doc,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {uploading && (
              <p className="text-sm text-blue-600 mt-2 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
              </p>
            )}

            {fileUrl && !uploading && (
              <div className="mt-3 flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                {getFileIcon()}
                <span className="text-sm text-green-800 dark:text-green-400 flex-1 truncate">
                  {fileName} ({formatSize(fileSize)})
                </span>
                <span className="text-xs text-green-600 dark:text-green-400">
                  ✅ Uploaded
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Link
              href="/admin/past-papers"
              className="px-5 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || uploading || !fileUrl}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Saving…' : 'Save Paper'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
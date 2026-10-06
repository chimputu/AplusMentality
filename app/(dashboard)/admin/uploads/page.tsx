'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Upload,
  FileText,
  Video,
  Image,
  Archive,
  Tag,
  Trash2,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  File,
} from 'lucide-react';

interface PendingUpload {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  suggestedCode: string | null;
  status: 'UNTAGGED' | 'TAGGED' | 'ARCHIVED';
  courseId: string | null;
  course: { code: string; title: string } | null;
  contentType: string | null;
  order: number | null;
  createdAt: string;
  taggedAt: string | null;
}

type FilterTab = 'ALL' | 'UNTAGGED' | 'TAGGED';

export default function AdminUploadsPage() {
  const router = useRouter();
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ file: string; progress: number }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUploads = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/uploads${filter !== 'ALL' ? '?status=' + filter : ''}`);
      if (res.ok) {
        const data = await res.json();
        setUploads(data);
      }
    } catch (error) {
      console.error('Failed to fetch uploads:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('video/')) return <Video className="w-5 h-5 text-purple-500" />;
    if (mimeType.startsWith('image/')) return <Image className="w-5 h-5 text-green-500" />;
    if (mimeType === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const handleFiles = async (files: FileList | File[]) => {
    setUploading(true);
    const fileArray = Array.from(files);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const fileName = file.name;
      setUploadProgress((prev) => [...prev, { file: fileName, progress: 0 }]);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/admin/uploads', {
          method: 'POST',
          body: formData,
        });

        setUploadProgress((prev) =>
          prev.map((p) => (p.file === fileName ? { ...p, progress: 100 } : p))
        );

        if (!res.ok) {
          const error = await res.json();
          alert(`Failed to upload ${fileName}: ${error.error}`);
        }
      } catch (error) {
        console.error(`Upload failed for ${fileName}:`, error);
        alert(`Failed to upload ${fileName}`);
      }
    }

    setUploading(false);
    setUploadProgress([]);
    fetchUploads();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this upload?')) return;
    try {
      const res = await fetch(`/api/admin/uploads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUploads();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete');
      }
    } catch (error) {
      alert('Failed to delete');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UNTAGGED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <AlertCircle className="w-3 h-3" /> Untagged
          </span>
        );
      case 'TAGGED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3" /> Tagged
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
            <Archive className="w-3 h-3" /> Archived
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Uploads</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Upload files first, tag them later to assign to courses.
          </p>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 bg-white dark:bg-gray-800'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(e.target.files);
              e.target.value = '';
            }
          }}
          accept=".pdf,.pptx,.ppt,.docx,.mp4,.mov,.jpg,.jpeg,.png,.zip"
        />
        <Upload
          className={`w-10 h-10 mx-auto mb-3 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`}
        />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {uploading ? 'Uploading...' : 'Drag & drop files here, or click to browse'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          PDF, PPTX, DOCX, MP4, JPG, PNG, ZIP — up to 100 MB each
        </p>
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadProgress.map((p) => (
            <div key={p.file} className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${p.progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                {p.file}
              </span>
              {p.progress === 100 && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              {p.progress < 100 && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mt-6 mb-4">
        {(['ALL', 'UNTAGGED', 'TAGGED'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {tab === 'ALL' ? 'All' : tab === 'UNTAGGED' ? 'Untagged' : 'Tagged'}
          </button>
        ))}
      </div>

      {/* Uploads Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : uploads.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Upload className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No uploads yet. Drop some files above to get started.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Suggested Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {uploads.map((upload) => (
                <tr
                  key={upload.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {getFileIcon(upload.mimeType)}
                      <div>
                        <p className="text-sm font-medium truncate max-w-[200px]">
                          {upload.originalName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(upload.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs uppercase bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {upload.fileType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {formatFileSize(upload.fileSize)}
                  </td>
                  <td className="px-6 py-4">
                    {upload.suggestedCode ? (
                      <span className="text-sm font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                        {upload.suggestedCode}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {upload.course ? (
                      <span className="text-sm">
                        {upload.course.code} — {upload.course.title}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(upload.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {upload.status === 'UNTAGGED' && (
                        <Link
                          href={`/admin/uploads/${upload.id}/tag`}
                          className="inline-flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                        >
                          <Tag className="w-4 h-4" /> Tag
                        </Link>
                      )}
                      <a
                        href={upload.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-600 dark:text-gray-400 hover:underline px-2"
                      >
                        Open
                      </a>
                      <button
                        onClick={() => handleDelete(upload.id)}
                        className="text-sm text-red-600 hover:text-red-700 px-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

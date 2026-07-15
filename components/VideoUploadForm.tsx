'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Loader2, CheckCircle, XCircle, Film, Video } from 'lucide-react';
// Remove Youtube import if not available

export default function VideoUploadForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState<'upload' | 'youtube'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (source === 'upload' && !file) {
      setError('Please select a video file');
      return;
    }
    if (source === 'youtube' && !youtubeUrl) {
      setError('Please enter a YouTube URL');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('source', source);

    if (source === 'upload' && file) {
      formData.append('file', file);
    }
    if (source === 'youtube' && youtubeUrl) {
      formData.append('youtubeUrl', youtubeUrl);
    }

    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTitle('');
        setDescription('');
        setFile(null);
        setYoutubeUrl('');
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || 'Failed to add video');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('An error occurred while uploading');
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeId = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([\w-]+)/,
      /(?:youtu\.be\/)([\w-]+)/,
      /(?:youtube\.com\/embed\/)([\w-]+)/,
      /(?:youtube\.com\/shorts\/)([\w-]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const youtubeId = getYouTubeId(youtubeUrl);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Video added successfully!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Video Title *
        </label>
        <input
          type="text"
          placeholder="Enter video title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          placeholder="Enter video description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
        />
      </div>

      {/* Source Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video Source *
        </label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setSource('upload')}
            className={`flex-1 px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
              source === 'upload'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setSource('youtube')}
            className={`flex-1 px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
              source === 'youtube'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Film className="w-4 h-4" />
            YouTube Link
          </button>
        </div>
      </div>

      {/* File Upload */}
      {source === 'upload' && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
            className="w-full cursor-pointer"
          />
          <p className="text-sm text-gray-500 mt-2">
            Max 50MB • MP4, WebM, OGG, MOV
          </p>
          {file && (
            <div className="bg-gray-50 rounded-lg p-3 mt-3 text-left">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Selected:</span> {file.name}
              </p>
              <p className="text-sm text-gray-500">
                Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <p className="text-sm text-gray-500">
                Type: {file.type || 'Unknown'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* YouTube URL */}
      {source === 'youtube' && (
        <div className="bg-gray-50 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            YouTube URL *
          </label>
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
          />
          <p className="text-xs text-gray-500 mt-2">
            Supports: youtube.com/watch?v=... • youtu.be/... • youtube.com/shorts/...
          </p>
          
          {/* YouTube Preview */}
          {youtubeId && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 font-medium mb-2">Preview:</p>
              <div className="w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  className="w-full h-full"
                  allowFullScreen
                  title="YouTube video preview"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full px-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
          loading
            ? 'bg-gray-400 cursor-not-allowed text-white'
            : source === 'youtube'
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {source === 'youtube' ? 'Adding YouTube Video...' : 'Uploading Video...'}
          </>
        ) : (
          <>
            {source === 'youtube' ? (
              <>
                <Film className="w-5 h-5" />
                Add YouTube Video
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Video
              </>
            )}
          </>
        )}
      </button>
    </form>
  );
}
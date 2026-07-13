'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VideoUploadForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState<'upload' | 'youtube'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (source === 'upload' && !file) {
      alert('Please select a video file');
      return;
    }
    if (source === 'youtube' && !youtubeUrl) {
      alert('Please enter a YouTube URL');
      return;
    }
    if (!title) {
      alert('Please enter a title');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
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

      if (res.ok) {
        setTitle('');
        setDescription('');
        setFile(null);
        setYoutubeUrl('');
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to add video');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <input
        type="text"
        placeholder="Video Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
      />
      <textarea
        placeholder="Video Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => setSource('upload')}
          className={`px-4 py-2 rounded-lg transition ${
            source === 'upload'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📤 Upload File
        </button>
        <button
          type="button"
          onClick={() => setSource('youtube')}
          className={`px-4 py-2 rounded-lg transition ${
            source === 'youtube'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ▶️ YouTube Link
        </button>
      </div>

      {source === 'upload' && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
            className="w-full cursor-pointer"
          />
          <p className="text-sm text-gray-500 mt-2">Max 50MB • MP4, WebM, etc.</p>
          {file && (
            <div className="bg-gray-50 rounded-lg p-3 mt-2">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Selected:</span> {file.name}
              </p>
              <p className="text-sm text-gray-500">
                Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>
      )}

      {source === 'youtube' && (
        <div className="bg-gray-50 rounded-lg p-4">
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            Supports: youtube.com/watch?v=... or youtu.be/...
          </p>
          {youtubeUrl && (
            <div className="mt-3">
              <p className="text-sm text-gray-600">Preview:</p>
              <div className="w-full max-w-xs aspect-video bg-black rounded-lg mt-1">
                <iframe
                  src={`https://www.youtube.com/embed/${new URL(youtubeUrl).searchParams.get('v') || ''}`}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
      >
        {loading ? 'Adding...' : source === 'youtube' ? 'Add YouTube Video' : 'Upload Video'}
      </button>
    </form>
  );
}
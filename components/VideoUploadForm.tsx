'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VideoUploadForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  // ✅ Check file size on client side too
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (selectedFile && selectedFile.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      e.target.value = '';
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setLoading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);

    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setTitle('');
        setDescription('');
        setFile(null);
        setProgress(100);
        router.refresh();
        alert('Video uploaded successfully!');
      } else {
        const error = await res.json().catch(() => ({ error: 'Upload failed' }));
        alert(error.error || 'Failed to upload video');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('An error occurred during upload. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 3000);
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
        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
      <textarea
        placeholder="Video Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          required
          className="w-full cursor-pointer"
        />
        <p className="text-sm text-gray-500 mt-2">
          ✅ Max file size: 50MB
        </p>
        <p className="text-xs text-gray-400">
          Supported formats: MP4, WebM, AVI, MOV
        </p>
      </div>
      {file && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Selected:</span> {file.name}
          </p>
          <p className="text-sm text-gray-500">
            Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
      )}
      {progress > 0 && progress < 100 && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <button
        type="submit"
        disabled={loading || !file}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
      >
        {loading ? 'Uploading...' : 'Upload Video'}
      </button>
    </form>
  );
}
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface SlideFormProps {
  initialData?: any;
  isEditing?: boolean;
}

export default function LectureSlideForm({ initialData, isEditing = false }: SlideFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    contentType: initialData?.contentType || 'google_slides',
    embedUrl: initialData?.embedUrl || '',
    fileUrl: initialData?.fileUrl || '',
    order: initialData?.order || 0,
    category: initialData?.category || '',
    courseId: initialData?.courseId || '',
  });

  useEffect(() => {
    fetch('/api/courses?all=true')
      .then(res => res.json())
      .then(data => setCourses(data))
      .catch(() => setCourses([]));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let fileUrl = form.fileUrl;
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!uploadRes.ok) throw new Error('File upload failed');
        const { url } = await uploadRes.json();
        fileUrl = url;
      }

      const payload = {
        ...form,
        fileUrl: fileUrl || null,
      };

      const url = isEditing ? `/api/lecture-slides/${initialData.id}` : '/api/lecture-slides';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push('/admin/lecture-slides');
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Computer Science',
    'Mathematics',
    'Natural Sciences',
    'Business',
    'Engineering',
    'Humanities',
    'Social Sciences',
    'Education',
    'Law',
    'Medicine',
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-medium">Title *</label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full border rounded px-4 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full border rounded px-4 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Content Type</label>
        <select
          value={form.contentType}
          onChange={(e) => setForm({ ...form, contentType: e.target.value })}
          className="w-full border rounded px-4 py-2"
        >
          <option value="google_slides">Google Slides</option>
          <option value="pdf">PDF</option>
        </select>
      </div>

      {form.contentType === 'google_slides' && (
        <div>
          <label className="block text-sm font-medium">Google Slides Embed URL *</label>
          <input
            type="url"
            required
            value={form.embedUrl}
            onChange={(e) => setForm({ ...form, embedUrl: e.target.value })}
            className="w-full border rounded px-4 py-2"
            placeholder="https://docs.google.com/presentation/d/.../embed"
          />
          <p className="text-xs text-gray-500 mt-1">From Google Slides: File → Publish to web → Embed → copy the URL</p>
        </div>
      )}

      {form.contentType === 'pdf' && (
        <div>
          <label className="block text-sm font-medium">Upload PDF</label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="w-full"
            required={!isEditing && !form.fileUrl}
          />
          {form.fileUrl && !file && <p className="text-sm text-green-600 mt-1">Current file: {form.fileUrl}</p>}
          {file && <p className="text-sm text-green-600 mt-1">Selected: {file.name}</p>}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium">Order</label>
        <input
          type="number"
          value={form.order}
          onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
          className="w-full border rounded px-4 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Category</label>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full border rounded px-4 py-2"
        >
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Or type a custom category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full border rounded px-4 py-2 mt-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Course (optional)</label>
        <select
          value={form.courseId}
          onChange={(e) => setForm({ ...form, courseId: e.target.value })}
          className="w-full border rounded px-4 py-2"
        >
          <option value="">None</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.code} – {c.title}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {isEditing ? 'Update' : 'Create'}
      </button>
    </form>
  );
}
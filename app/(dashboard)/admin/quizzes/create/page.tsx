'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function CreateQuizPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    contentType: 'google_form',
    embedUrl: '',
    formUrl: '',
    dueDate: '',
  });
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let fileUrl = '';
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
        contentType: form.contentType,
      };

      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push('/admin/quizzes');
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create quiz');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/admin/quizzes" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <h1 className="text-2xl font-bold mb-6">Create Quiz</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow border">
        <div>
          <label className="block text-sm font-medium">Title *</label>
          <input
            type="text"
            required
            className="w-full border rounded px-4 py-2"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            rows={3}
            className="w-full border rounded px-4 py-2"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Content Type</label>
          <select
            className="w-full border rounded px-4 py-2"
            value={form.contentType}
            onChange={(e) => setForm({ ...form, contentType: e.target.value })}
          >
            <option value="google_form">Google Form</option>
            <option value="pdf">PDF</option>
            <option value="image">Image</option>
          </select>
        </div>
        {form.contentType === 'google_form' && (
          <>
            <div>
              <label className="block text-sm font-medium">Embed URL</label>
              <input
                type="url"
                className="w-full border rounded px-4 py-2"
                value={form.embedUrl}
                onChange={(e) => setForm({ ...form, embedUrl: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Shareable Link</label>
              <input
                type="url"
                className="w-full border rounded px-4 py-2"
                value={form.formUrl}
                onChange={(e) => setForm({ ...form, formUrl: e.target.value })}
                required
              />
            </div>
          </>
        )}
        {(form.contentType === 'pdf' || form.contentType === 'image') && (
          <div>
            <label className="block text-sm font-medium">Upload File</label>
            <input
              type="file"
              accept={form.contentType === 'pdf' ? '.pdf' : 'image/*'}
              onChange={handleFileChange}
              className="w-full"
              required
            />
            {file && <p className="text-sm text-green-600 mt-1">Selected: {file.name}</p>}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium">Due Date (optional)</label>
          <input
            type="datetime-local"
            className="w-full border rounded px-4 py-2"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin inline" /> : 'Create Quiz'}
        </button>
      </form>
    </div>
  );
}
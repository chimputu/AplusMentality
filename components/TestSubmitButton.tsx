'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ExternalLink, Upload } from 'lucide-react';

interface TestSubmitButtonProps {
  testId: string;
  formUrl: string;
  isGoogleForm: boolean;
}

export default function TestSubmitButton({ testId, formUrl, isGoogleForm }: TestSubmitButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async () => {
    if (!isGoogleForm && !file) {
      alert('Please upload your answer file (PDF or image) before submitting.');
      return;
    }

    if (!confirm('Have you completed the test? Click OK to submit.')) return;

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

      const res = await fetch(`/api/tests/${testId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl }),
      });

      if (res.ok) {
        if (isGoogleForm && formUrl) {
          window.location.href = formUrl;
        } else {
          router.push('/student/tests?submitted=true');
          router.refresh();
        }
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to submit test');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!isGoogleForm && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          <label className="cursor-pointer block">
            <Upload className="w-8 h-8 mx-auto text-gray-400" />
            <span className="text-sm text-gray-600">Click to upload your answer (PDF or image)</span>
            <input type="file" accept=".pdf,image/*" onChange={handleFileChange} className="hidden" />
          </label>
          {file && <p className="text-sm text-green-600 mt-2">Selected: {file.name}</p>}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {isGoogleForm && formUrl && (
          <a
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Open Test in New Tab <ExternalLink className="w-4 h-4" />
          </a>
        )}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
          ) : (
            'I have completed the test'
          )}
        </button>
      </div>
    </div>
  );
}
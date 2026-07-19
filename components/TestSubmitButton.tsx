'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ExternalLink } from 'lucide-react';

interface TestSubmitButtonProps {
  testId: string;
  formUrl: string;
  isGoogleForm: boolean;
}

export default function TestSubmitButton({ testId, formUrl, isGoogleForm }: TestSubmitButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!confirm('Have you completed the test? Click OK to submit your attempt.')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tests/${testId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        router.push(`/student/tests/${testId}/results`);
        router.refresh();
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
  );
}
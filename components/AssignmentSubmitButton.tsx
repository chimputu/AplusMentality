'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ExternalLink } from 'lucide-react';

interface AssignmentSubmitButtonProps {
  assignmentId: string;
  formUrl: string;
  isGoogleForm: boolean;
}

export default function AssignmentSubmitButton({ assignmentId, formUrl, isGoogleForm }: AssignmentSubmitButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!confirm('Have you completed the assignment? Click OK to submit your work.')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        router.push(`/student/assignments/${assignmentId}/results`);
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to submit assignment');
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
          Open Assignment in New Tab <ExternalLink className="w-4 h-4" />
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
          'I have submitted the assignment'
        )}
      </button>
    </div>
  );
}
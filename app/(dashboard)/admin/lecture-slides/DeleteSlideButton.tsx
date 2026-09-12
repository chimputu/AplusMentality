'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DeleteSlideButton({ slideId }: { slideId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this slide?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/lecture-slides/${slideId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete slide');

      // Refresh the server component data
      router.refresh();
    } catch (err) {
      alert('Failed to delete slide.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-600 hover:underline flex items-center gap-1 disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
      {loading ? 'Deleting...' : 'Delete'}
    </button>
  );
}
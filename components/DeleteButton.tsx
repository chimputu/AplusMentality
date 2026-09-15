// components/DeleteButton.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteButtonProps {
  apiUrl: string;
  itemName: string;
  confirmMessage?: string;
}

export default function DeleteButton({
  apiUrl,
  itemName,
  confirmMessage,
}: DeleteButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    const message =
      confirmMessage ||
      `Are you sure you want to delete "${itemName}"? This cannot be undone.`;

    if (!confirm(message)) return;

    setDeleting(true);
    try {
      const res = await fetch(apiUrl, { method: 'DELETE' });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete');
      }

      router.refresh();
    } catch (e: any) {
      alert(e.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 inline-flex items-center"
      title="Delete"
    >
      {deleting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}
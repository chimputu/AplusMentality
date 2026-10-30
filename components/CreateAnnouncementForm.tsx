'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Institution {
  id: string;
  name: string;
}

export default function CreateAnnouncementForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if the user is a Super Admin and fetch institutions
    const checkRoleAndFetchInstitutions = async () => {
      try {
        const res = await fetch('/api/users/me');
        if (res.ok) {
          const user = await res.json();
          if (user.role === 'SUPER_ADMIN') {
            setIsSuperAdmin(true);
            // Fetch all institutions for the dropdown
            const instRes = await fetch('/api/institutions');
            if (instRes.ok) {
              const instData = await instRes.json();
              setInstitutions(Array.isArray(instData) ? instData : []);
            }
          }
        }
      } catch (error) {
        console.error('Failed to check role:', error);
      } finally {
        setLoadingInstitutions(false);
      }
    };

    checkRoleAndFetchInstitutions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setLoading(true);
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, institutionId }),
      });

      if (res.ok) {
        setTitle('');
        setContent('');
        setInstitutionId(null);
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create announcement');
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
        placeholder="Announcement Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-background text-foreground"
      />
      <textarea
        placeholder="Announcement Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        rows={4}
        className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-background text-foreground"
      />

      {/* Institution selector — only visible to Super Admin */}
      {isSuperAdmin && !loadingInstitutions && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Target Audience
          </label>
          <select
            value={institutionId ?? ''}
            onChange={(e) =>
              setInstitutionId(e.target.value || null)
            }
            className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-background text-foreground"
          >
            <option value="">All Universities (Global)</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Select "All Universities" for a global announcement, or pick a
            specific university to target.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {loading ? 'Posting...' : 'Post Announcement'}
      </button>
    </form>
  );
}
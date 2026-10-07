'use client';

import { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';

interface Programme {
  id: string;
  name: string;
  code: string | null;
  _count: {
    courses: number;
  };
}

export default function ProgrammePicker({
  institutionId,
  value,
  onChange,
}: {
  institutionId: string;
  value?: string;
  onChange: (id: string) => void;
}) {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchProgrammes() {
      try {
        const res = await fetch(`/api/institutions/${institutionId}/programmes`);
        if (res.ok) {
          const data = await res.json();
          setProgrammes(data.programmes || data || []);
        }
      } catch (error) {
        console.error('Failed to fetch programmes:', error);
      } finally {
        setLoading(false);
      }
    }
    if (institutionId) fetchProgrammes();
  }, [institutionId]);

  const filtered = programmes.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Search programmes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm mb-2"
      />
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      >
        <option value="">Select a programme...</option>
        {loading ? (
          <option disabled>Loading...</option>
        ) : filtered.length === 0 ? (
          <option disabled>No programmes yet. Add one in /admin/programmes.</option>
        ) : (
          filtered.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.code}) — {p._count.courses} courses
            </option>
          ))
        )}
      </select>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { Building2, Globe } from 'lucide-react';

interface University {
  id: string;
  name: string;
  code: string;
}

export function UniversitySwitcher() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/universities')
      .then((res) => res.json())
      .then((data: University[]) => {
        setUniversities(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSelectedId(searchParams.get('university') || '');
  }, [searchParams]);

  const handleChange = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      params.set('university', id);
    } else {
      params.delete('university');
    }
    router.push(`${pathname}?${params.toString()}`);
    setSelectedId(id);
  };

  const selectedUni = universities.find((u) => u.id === selectedId);

  if (loading || universities.length === 0) return null;

  return (
    <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-700">
      <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">
        Browse University
      </label>
      <div className="relative">
        <select
          value={selectedId}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Universities</option>
          {universities.map((uni) => (
            <option key={uni.id} value={uni.id}>
              {uni.name} ({uni.code})
            </option>
          ))}
        </select>
        <Building2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      {selectedUni && (
        <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
          <Globe className="w-3 h-3" />
          Viewing: {selectedUni.name}
        </p>
      )}
    </div>
  );
}

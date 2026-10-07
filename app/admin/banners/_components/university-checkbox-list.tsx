'use client';

import { useState, useEffect } from 'react';
import { Search, CheckSquare, Square } from 'lucide-react';

interface Institution {
  id: string;
  name: string;
  shortName?: string | null;
  type: string;
}

interface UniversityCheckboxListProps {
  value: string[];
  onChange: (selected: string[]) => void;
}

const typeIcons: Record<string, string> = {
  UNIVERSITY: '🎓',
  COLLEGE: '🏛️',
  POLYTECHNIC: '🔬',
  INSTITUTE: '🏛️',
  MEDICAL_SCHOOL: '⚕️',
  BUSINESS_SCHOOL: '💼',
  TECHNICAL_COLLEGE: '🔧',
  VOCATIONAL_SCHOOL: '🛠️',
};

export default function UniversityCheckboxList({ value, onChange }: UniversityCheckboxListProps) {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/institutions/picker')
      .then((res) => res.json())
      .then((data) => {
        setInstitutions(data.institutions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = institutions.filter((inst) =>
    inst.name.toLowerCase().includes(search.toLowerCase()) ||
    (inst.shortName && inst.shortName.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleInstitution = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const selectAll = () => {
    onChange(institutions.map((i) => i.id));
  };

  const deselectAll = () => {
    onChange([]);
  };

  const selectedCount = value.length;
  const totalCount = institutions.length;

  if (loading) {
    return <div className="text-sm text-gray-500">Loading institutions...</div>;
  }

  return (
    <div className="space-y-3">
      {/* Search + Actions */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search universities..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          type="button"
          onClick={selectAll}
          className="px-3 py-2 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={deselectAll}
          className="px-3 py-2 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
        >
          Deselect all
        </button>
      </div>

      {/* Checkbox list */}
      <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-700">
        {filtered.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            No institutions found
          </div>
        ) : (
          filtered.map((inst) => {
            const checked = value.includes(inst.id);
            const icon = typeIcons[inst.type] || '🏫';
            return (
              <button
                key={inst.id}
                type="button"
                onClick={() => toggleInstitution(inst.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              >
                {checked ? (
                  <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
                <span className="text-sm">{icon}</span>
                <span className="text-sm text-gray-900 dark:text-gray-100 flex-1">
                  {inst.name}
                  {inst.shortName && (
                    <span className="text-gray-500 dark:text-gray-400 ml-1">({inst.shortName})</span>
                  )}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Counter */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        ✅ {selectedCount} of {totalCount} universities selected
      </div>
    </div>
  );
}

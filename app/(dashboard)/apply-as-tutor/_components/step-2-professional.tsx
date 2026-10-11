'use client';

import { useEffect, useState } from 'react';
import { fetchInstitutionsForDropdown } from '@/lib/data/dropdowns';

interface Props {
  formData: any;
  updateField: (field: string, value: any) => void;
}

export default function Step2Professional({ formData, updateField }: Props) {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstitutionsForDropdown().then((data) => {
      setInstitutions(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Institution
        </label>
        {loading ? (
          <div className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500">
            Loading...
          </div>
        ) : (
          <select
            value={formData.institutionId || ''}
            onChange={(e) => updateField('institutionId', e.target.value || null)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select institution</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.shortName || inst.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Years of Teaching Experience
        </label>
        <input
          type="number"
          min={0}
          max={60}
          value={formData.experienceYears}
          onChange={(e) => updateField('experienceYears', parseInt(e.target.value) || 0)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}

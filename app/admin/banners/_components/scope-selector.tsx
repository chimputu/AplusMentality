'use client';

import UniversityCheckboxList from './university-checkbox-list';

interface ScopeSelectorProps {
  scope: 'GLOBAL' | 'ALL' | 'SPECIFIC';
  institutionIds: string[];
  onScopeChange: (scope: 'GLOBAL' | 'ALL' | 'SPECIFIC') => void;
  onInstitutionIdsChange: (ids: string[]) => void;
}

export default function ScopeSelector({
  scope,
  institutionIds,
  onScopeChange,
  onInstitutionIdsChange,
}: ScopeSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          🎯 Target Audience
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Who should see this banner?
        </p>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="scope"
              value="GLOBAL"
              checked={scope === 'GLOBAL'}
              onChange={() => onScopeChange('GLOBAL')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Global (everyone, including logged-out users)
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="scope"
              value="ALL"
              checked={scope === 'ALL'}
              onChange={() => onScopeChange('ALL')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              All universities (logged-in users only)
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="scope"
              value="SPECIFIC"
              checked={scope === 'SPECIFIC'}
              onChange={() => onScopeChange('SPECIFIC')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Specific universities
            </span>
          </label>
        </div>
      </div>

      {scope === 'ALL' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
          This banner will be visible to all logged-in users across every institution.
        </div>
      )}

      {scope === 'SPECIFIC' && (
        <UniversityCheckboxList
          value={institutionIds}
          onChange={onInstitutionIdsChange}
        />
      )}
    </div>
  );
}

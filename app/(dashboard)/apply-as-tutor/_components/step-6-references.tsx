'use client';

import { Plus, X } from 'lucide-react';

interface Props {
  formData: any;
  updateField: (field: string, value: any) => void;
}

export default function Step6References({ formData, updateField }: Props) {
  const references = formData.references || [];

  const addReference = () => {
    if (references.length >= 5) return;
    const newRefs = [...references, {
      fullName: '',
      relationship: '',
      email: '',
      phone: '',
      institution: '',
    }];
    updateField('references', newRefs);
  };

  const removeReference = (index: number) => {
    const newRefs = references.filter((_: any, i: number) => i !== index);
    updateField('references', newRefs);
  };

  const updateReference = (index: number, field: string, value: any) => {
    const newRefs = [...references];
    newRefs[index] = { ...newRefs[index], [field]: value };
    updateField('references', newRefs);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Provide 2-5 professional or academic references who can vouch for your teaching ability.
        </p>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {references.length}/5 references added
          </span>
          <button
            type="button"
            onClick={addReference}
            disabled={references.length >= 5}
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Reference
          </button>
        </div>
      </div>

      {references.map((ref: any, index: number) => (
        <div
          key={index}
          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Reference {index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeReference(index)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ref.fullName || ''}
                onChange={(e) => updateReference(index, 'fullName', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Dr. Jane Smith"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Relationship <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ref.relationship || ''}
                onChange={(e) => updateReference(index, 'relationship', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Former supervisor, Professor, etc."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={ref.email || ''}
                onChange={(e) => updateReference(index, 'email', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="jane@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={ref.phone || ''}
                onChange={(e) => updateReference(index, 'phone', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+260 97 1234567"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Institution
              </label>
              <input
                type="text"
                value={ref.institution || ''}
                onChange={(e) => updateReference(index, 'institution', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="University of Zambia"
              />
            </div>
          </div>
        </div>
      ))}

      {references.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-500 text-center py-4">
          No references added yet. You need at least 2 references.
        </p>
      )}
    </div>
  );
}

'use client';

import { Plus, X } from 'lucide-react';

interface Props {
  formData: any;
  updateField: (field: string, value: any) => void;
}

export default function Step3Qualifications({ formData, updateField }: Props) {
  const addQualification = () => {
    const quals = [...(formData.qualifications || []), { degree: '', institution: '', year: new Date().getFullYear() }];
    updateField('qualifications', quals);
  };

  const removeQualification = (index: number) => {
    const quals = formData.qualifications.filter((_: any, i: number) => i !== index);
    updateField('qualifications', quals);
  };

  const updateQualification = (index: number, field: string, value: any) => {
    const quals = [...formData.qualifications];
    quals[index] = { ...quals[index], [field]: value };
    updateField('qualifications', quals);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Add your academic qualifications (optional)
        </p>
        <button
          type="button"
          onClick={addQualification}
          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Qualification
        </button>
      </div>

      {formData.qualifications?.map((qual: any, index: number) => (
        <div
          key={index}
          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Qualification {index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeQualification(index)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Degree
              </label>
              <input
                type="text"
                value={qual.degree}
                onChange={(e) => updateQualification(index, 'degree', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="BSc Computer Science"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Institution
              </label>
              <input
                type="text"
                value={qual.institution}
                onChange={(e) => updateQualification(index, 'institution', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="University of Zambia"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Year
              </label>
              <input
                type="number"
                value={qual.year}
                onChange={(e) => updateQualification(index, 'year', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="2020"
              />
            </div>
          </div>
        </div>
      ))}

      {formData.qualifications?.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-500 text-center py-4">
          No qualifications added. You can add them later.
        </p>
      )}
    </div>
  );
}

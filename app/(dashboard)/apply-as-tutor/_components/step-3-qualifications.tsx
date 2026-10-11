'use client';

import { Plus, X } from 'lucide-react';
import { ImageUploader } from '@/components/tutor-application/image-uploader';

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
    <div className="space-y-8">
      {/* Academic Qualifications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Academic Qualifications
          </h3>
          <button
            type="button"
            onClick={addQualification}
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Qualification
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Add your academic qualifications (optional)
        </p>

        {formData.qualifications?.map((qual: any, index: number) => (
          <div
            key={index}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3 mb-3"
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

      {/* Grade 12 Results */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Grade 12 Results
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              School Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.grade12School || ''}
              onChange={(e) => updateField('grade12School', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Lusaca High School"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Year Completed <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.grade12Year || ''}
              onChange={(e) => updateField('grade12Year', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="2018"
              min={1990}
              max={new Date().getFullYear()}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Summary of Results <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.grade12Summary || ''}
            onChange={(e) => updateField('grade12Summary', e.target.value)}
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            placeholder="e.g., 8 subjects: Math (A), English (B+), Physics (A-), Chemistry (B), Biology (A), Geography (B+), History (C+), Economics (B)"
          />
        </div>
        <div className="mt-4">
          <ImageUploader
            label="Grade 12 Results Document"
            description="Upload your Grade 12 certificate or results slip"
            value={formData.grade12ResultsUrl}
            onChange={(url, publicId) => {
              updateField('grade12ResultsUrl', url);
            }}
            folder="tutor-applications/grade12"
            aspectRatio="free"
            maxSizeMB={5}
          />
        </div>
      </div>

      {/* Current Academic Records */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Current Academic Records <span className="text-gray-400">(if applicable)</span>
          </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Institution
            </label>
            <input
              type="text"
              value={formData.currentInstitution || ''}
              onChange={(e) => updateField('currentInstitution', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="University of Zambia"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Programme
            </label>
            <input
              type="text"
              value={formData.currentProgramme || ''}
              onChange={(e) => updateField('currentProgramme', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="BSc Computer Science"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Year
            </label>
            <input
              type="number"
              value={formData.currentYear || ''}
              onChange={(e) => updateField('currentYear', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="3"
              min={1}
              max={10}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Academic Summary
          </label>
          <textarea
            value={formData.academicSummary || ''}
            onChange={(e) => updateField('academicSummary', e.target.value)}
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            placeholder="Brief summary of your current academic standing..."
          />
        </div>
        <div className="mt-4">
          <ImageUploader
            label="Academic Records Document"
            description="Upload current transcript or academic record (optional)"
            value={formData.academicRecordsUrl}
            onChange={(url, publicId) => {
              updateField('academicRecordsUrl', url);
            }}
            folder="tutor-applications/academic-records"
            aspectRatio="free"
            maxSizeMB={5}
          />
        </div>
      </div>
    </div>
  );
}

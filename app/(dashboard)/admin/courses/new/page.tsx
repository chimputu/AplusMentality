'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { addCourseToProgramme } from '@/lib/actions/programme-tree';
import { ProgrammeSelect } from '@/components/ui/selects/programme-select';
import { DataSelect } from '@/components/ui/data-select';

export default function NewCoursePage() {
  const searchParams = useSearchParams();
  const institutionId = searchParams.get('institutionId') || undefined;
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedProgrammeId, setSelectedProgrammeId] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await addCourseToProgramme({
        programmeId: selectedProgrammeId,
        levelId: selectedLevelId,
        periodId: selectedPeriodId || undefined,
        code,
        name,
        description: description || undefined,
      });
      router.push('/admin/courses');
    } catch (err: any) {
      setError(err.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Add New Course</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Add a course to a programme and year
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              {s}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {s === 1 ? 'Programme' : s === 2 ? 'Year' : 'Details'}
            </span>
            {s < 3 && <div className="w-8 h-px bg-gray-300 dark:bg-gray-600" />}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <ProgrammeSelect
              institutionId={institutionId}
              value={selectedProgrammeId}
              onChange={(v) => {
                setSelectedProgrammeId(v);
                setSelectedLevelId('');
                setSelectedPeriodId('');
              }}
            />
            <button
              onClick={() => selectedProgrammeId && setStep(2)}
              disabled={!selectedProgrammeId}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg text-sm font-medium transition"
            >
              Next: Select Year
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <DataSelect
              value={selectedLevelId}
              onChange={(v) => {
                setSelectedLevelId(v);
                setSelectedPeriodId('');
              }}
              label="Year / Level"
              fetchFn={async () => {
                if (!selectedProgrammeId) return [];
                const res = await fetch(`/api/programmes/${selectedProgrammeId}/tree`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                return data.levels || [];
              }}
              dependencies={[selectedProgrammeId]}
              getValue={(l: any) => l.id}
              getLabel={(l: any) => l.name}
              placeholder="Select a year..."
              emptyMessage="No years defined for this institution."
              errorMessage="Couldn't load years."
            />
            <DataSelect
              value={selectedPeriodId}
              onChange={setSelectedPeriodId}
              label="Period (optional)"
              fetchFn={async () => {
                if (!selectedProgrammeId) return [];
                const res = await fetch(`/api/programmes/${selectedProgrammeId}/tree`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                // Extract unique periods from courses
                const periodMap = new Map<string, { id: string; name: string }>();
                for (const level of data.levels || []) {
                  for (const course of level.courses || []) {
                    if (course.period?.id && !periodMap.has(course.period.id)) {
                      periodMap.set(course.period.id, { id: course.period.id, name: course.period.name });
                    }
                  }
                }
                return Array.from(periodMap.values());
              }}
              dependencies={[selectedProgrammeId, selectedLevelId]}
              getValue={(p: any) => p.id}
              getLabel={(p: any) => p.name}
              placeholder="No period"
              emptyMessage="No periods defined yet."
              errorMessage="Couldn't load periods."
            />
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Back
              </button>
              <button
                onClick={() => selectedLevelId && setStep(3)}
                disabled={!selectedLevelId}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg text-sm font-medium transition"
              >
                Next: Course Details
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Course Code
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                placeholder="CS101"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Course Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                placeholder="Introduction to Computer Science"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (optional)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition"
              >
                {loading ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

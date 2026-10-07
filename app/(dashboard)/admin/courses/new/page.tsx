'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addCourseToProgramme } from '@/lib/actions/programme-tree';
import ProgrammePicker from '@/components/programme-picker';

export default function NewCoursePage({
  institutionId,
}: {
  institutionId?: string;
}) {
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
  const [levels, setLevels] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);

  // Fetch levels when programme changes
  useEffect(() => {
    if (!selectedProgrammeId) return;
    async function fetchDetails() {
      try {
        const res = await fetch(`/api/programmes/${selectedProgrammeId}/tree`);
        if (res.ok) {
          const data = await res.json();
          setLevels(data.levels || []);
        }
      } catch (err) {
        console.error('Failed to fetch programme details:', err);
      }
    }
    fetchDetails();
  }, [selectedProgrammeId]);

  // Fetch periods when level changes
  useEffect(() => {
    if (!selectedLevelId) return;
    async function fetchPeriods() {
      try {
        const res = await fetch(`/api/programmes/${selectedProgrammeId}/tree`);
        if (res.ok) {
          const data = await res.json();
          // Periods would come from the institution
          setPeriods([]);
        }
      } catch (err) {
        console.error('Failed to fetch periods:', err);
      }
    }
    fetchPeriods();
  }, [selectedLevelId, selectedProgrammeId]);

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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Programme
              </label>
              {institutionId ? (
                <ProgrammePicker
                  institutionId={institutionId}
                  value={selectedProgrammeId}
                  onChange={setSelectedProgrammeId}
                />
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No institution selected. Please set up an institution first.
                </p>
              )}
            </div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Year
              </label>
              <select
                value={selectedLevelId}
                onChange={(e) => setSelectedLevelId(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="">Select a year...</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Period (optional)
              </label>
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="">No period</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
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

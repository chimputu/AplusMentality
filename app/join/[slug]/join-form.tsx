'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, GraduationCap, CheckCircle } from 'lucide-react';
import { joinUniversity } from '@/lib/actions/user-admin';

interface Branch {
  id: string;
  name: string;
}

interface Faculty {
  id: string;
  name: string;
  code: string;
}

interface Programme {
  id: string;
  name: string;
  code: string | null;
  facultyId: string | null;
  faculty: Faculty | null;
  branches: Branch[];
}

interface AcademicLevel {
  id: string;
  name: string;
  order: number;
}

interface JoinFormProps {
  slug: string;
  orgName: string;
  programmes: Programme[];
  levels?: AcademicLevel[];
  hasBranches?: boolean;
}

export default function JoinForm({ slug, orgName, programmes, levels, hasBranches }: JoinFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [programmeId, setProgrammeId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [year, setYear] = useState('');
  const [period, setPeriod] = useState('');

  const selectedProgramme = programmes.find((p) => p.id === programmeId);
  const programmeBranches = selectedProgramme?.branches || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    startTransition(async () => {
      try {
        const result = await joinUniversity({
          slug,
          programmeId: programmeId || undefined,
          year: year ? parseInt(year) : undefined,
          period: period || undefined,
          branchId: branchId || undefined,
        });

        if (result.error) {
          setError(result.error);
          return;
        }

        setSuccess(true);
        setTimeout(() => {
          router.refresh();
          window.location.href = '/student';
        }, 1500);
      } catch (err: any) {
        setError(err.message || 'Failed to join. Please try again.');
      }
    });
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Welcome to {orgName}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You have been successfully enrolled. Redirecting to your dashboard...
          </p>
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 max-w-lg w-full">
        <div className="text-center mb-8">
          <GraduationCap className="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Join {orgName}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Complete your details to access your student dashboard.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Programme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Programme
            </label>
            {programmes.length > 0 ? (
              <select
                value={programmeId}
                onChange={(e) => {
                  setProgrammeId(e.target.value);
                  setBranchId('');
                }}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-base"
              >
                <option value="">Select your programme</option>
                {programmes.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.name}
                    {prog.faculty && ` — ${prog.faculty.name}`}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                <p className="text-blue-700 dark:text-blue-400">
                  No programmes available yet. Contact your admin.
                </p>
              </div>
            )}
          </div>

          {/* Branch */}
          {programmeId && programmeBranches.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Branch
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-base"
              >
                <option value="">Select your branch</option>
                {programmeBranches.map((br) => (
                  <option key={br.id} value={br.id}>
                    {br.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Year/Level */}
          {levels && levels.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Academic Level
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-base"
              >
                <option value="">Select your level</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.order}>
                    {level.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-base"
            >
              <option value="">Select your period</option>
              <option value="1">Period 1</option>
              <option value="2">Period 2</option>
              <option value="3">Period 3</option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 min-h-[44px]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <GraduationCap className="w-4 h-4" />
                Join {orgName}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

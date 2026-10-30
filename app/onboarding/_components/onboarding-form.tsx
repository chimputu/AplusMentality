'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, GraduationCap, Lock } from 'lucide-react';
import { completeOnboarding } from '@/lib/actions/user-admin';
import { InstitutionSelect } from '@/components/ui/selects/institution-select';
import { ProgrammeSelect } from '@/components/ui/selects/programme-select';
import { BranchSelect } from '@/components/ui/selects/branch-select';

interface AcademicLevel {
  id: string;
  name: string;
  order: number;
}

interface AcademicPeriod {
  id: string;
  name: string;
  order: number;
}

interface InstitutionWithDetails {
  id: string;
  name: string;
  slug: string;
  levels: AcademicLevel[];
  periods: AcademicPeriod[];
  hasBranches: boolean;
}

interface User {
  id: string;
  clerkId: string;
  email: string;
  role: string;
}

interface OnboardingFormProps {
  user: User;
  lockedInstitutionId?: string;
  lockedInstitutionName?: string;
  lockedInstitutionDetails?: InstitutionWithDetails;
}

export default function OnboardingForm({
  user,
  lockedInstitutionId,
  lockedInstitutionName,
  lockedInstitutionDetails,
}: OnboardingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [institutionId, setInstitutionId] = useState(lockedInstitutionId || '');
  const [programmeId, setProgrammeId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [year, setYear] = useState('');
  const [period, setPeriod] = useState('');

  // Dynamic data fetched on the client
  const [levels, setLevels] = useState<AcademicLevel[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [hasBranches, setHasBranches] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const isLocked = !!lockedInstitutionId;

  // Fetch institution metadata (levels, periods, hasBranches) when institution changes
  useEffect(() => {
    if (!institutionId) {
      setLevels([]);
      setPeriods([]);
      setHasBranches(false);
      return;
    }

    // If locked, use preloaded details
    if (isLocked && lockedInstitutionDetails) {
      setLevels(lockedInstitutionDetails.levels || []);
      setPeriods(lockedInstitutionDetails.periods || []);
      setHasBranches(lockedInstitutionDetails.hasBranches || false);
      return;
    }

    setLoadingMeta(true);
    Promise.all([
      fetch(`/api/admin/levels?institutionId=${institutionId}`).then((r) => r.json()).catch(() => ({ data: [] as AcademicLevel[] })),
      fetch(`/api/admin/periods?institutionId=${institutionId}`).then((r) => r.json()).catch(() => ({ data: [] as AcademicPeriod[] })),
      fetch(`/api/institutions/picker`).then((r) => r.json()).catch(() => ({ data: [] as any[] })),
    ]).then(([levelsRes, periodsRes, institutionsRes]) => {
      setLevels(levelsRes.data || []);
      setPeriods(periodsRes.data || []);
      const instData = institutionsRes.data || [];
      const inst = instData.find((i: any) => i.id === institutionId);
      setHasBranches(inst?.hasBranches || false);
    }).finally(() => {
      setLoadingMeta(false);
    });
  }, [institutionId, isLocked, lockedInstitutionDetails]);

  // When programme changes, reset branch
  const handleProgrammeChange = (value: string) => {
    setProgrammeId(value);
    setBranchId('');
  };

  // When institution changes, reset all children
  const handleInstitutionChange = (value: string) => {
    setInstitutionId(value);
    setProgrammeId('');
    setBranchId('');
    setYear('');
    setPeriod('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const data: any = {
          institutionId,
        };

        if (programmeId) data.programmeId = programmeId;
        if (branchId) data.branchId = branchId;
        if (year) data.year = parseInt(year);
        if (period) data.period = period;

        const result = await completeOnboarding(data);

        if (result.error) {
          throw new Error(result.error);
        }

        // Redirect based on role
        const role = user.role || 'STUDENT';
        router.refresh();
        window.location.href = (role === 'ADMIN' || role === 'SUPER_ADMIN') ? '/admin' : '/student';
      } catch (err: any) {
        console.error('Onboarding error:', err.message);
        alert(err.message || 'Failed to complete onboarding. Please try again.');
      }
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Institution */}
        {isLocked ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Institution
            </label>
            <div className="w-full border border-blue-300 dark:border-blue-700 rounded-lg px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="font-medium">{lockedInstitutionName}</span>
            </div>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              This institution was pre-selected by your join link and cannot be changed.
            </p>
          </div>
        ) : (
          <InstitutionSelect
            value={institutionId}
            onChange={handleInstitutionChange}
            label="Institution"
          />
        )}

        {/* Programme */}
        <ProgrammeSelect
          institutionId={institutionId || undefined}
          value={programmeId}
          onChange={handleProgrammeChange}
          label="Programme"
        />

        {/* Branch (only if institution has branches) */}
        {hasBranches && (
          <BranchSelect
            programmeId={programmeId || undefined}
            value={branchId}
            onChange={setBranchId}
            label="Branch"
          />
        )}

        {/* Year/Level — dynamic dropdown */}
        {institutionId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Academic Level
            </label>
            {loadingMeta ? (
              <div className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-base flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading levels...
              </div>
            ) : levels.length > 0 ? (
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-base"
              >
                <option value="">Select your level</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.order}>
                    {level.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
                <p className="text-amber-700 dark:text-amber-400">
                  No academic levels defined for this institution yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Period — dynamic dropdown */}
        {institutionId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Period
            </label>
            {loadingMeta ? (
              <div className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-base flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading periods...
              </div>
            ) : periods.length > 0 ? (
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-base"
              >
                <option value="">Select your period</option>
                {periods.map((p) => (
                  <option key={p.id} value={String(p.order)}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
                <p className="text-amber-700 dark:text-amber-400">
                  No periods defined for this institution yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 min-h-[44px]"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <GraduationCap className="w-4 h-4" />
              Complete Onboarding
            </>
          )}
        </button>
      </form>
    </div>
  );
}

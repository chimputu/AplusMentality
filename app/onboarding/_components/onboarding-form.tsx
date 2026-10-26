'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, GraduationCap, Lock } from 'lucide-react';

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

interface Institution {
  id: string;
  name: string;
  slug: string;
  programmes: Programme[];
  levels: AcademicLevel[];
  hasFaculties: boolean;
  hasBranches: boolean;
}

interface University {
  id: string;
  name: string;
  code: string;
  programmes: Programme[];
}

interface User {
  id: string;
  clerkId: string;
  email: string;
  role: string;
}

interface OnboardingFormProps {
  user: User;
  institutions: Institution[];
  universities: University[];
  lockedInstitution?: Institution | University;
  lockedType?: 'institution' | 'university';
}

export default function OnboardingForm({ user, institutions, universities, lockedInstitution, lockedType }: OnboardingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // If locked via join link, pre-fill the institution ID and type
  const [institutionId, setInstitutionId] = useState(lockedInstitution?.id || '');
  const [programmeId, setProgrammeId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [year, setYear] = useState('');
  const [period, setPeriod] = useState('');

  const isLocked = !!lockedInstitution;

  // Determine whether the selected school is an institution or a university
  const selectedInstitution = institutions.find((i) => i.id === institutionId);
  const selectedUniversity = universities.find((u) => u.id === institutionId);
  const isUniversity = lockedType === 'university' || !!selectedUniversity;

  // Get programmes from the locked institution or the selected school
  const schoolProgrammes = lockedInstitution?.programmes || selectedInstitution?.programmes || selectedUniversity?.programmes || [];
  const selectedProgramme = schoolProgrammes.find((p) => p.id === programmeId);
  const programmeBranches = selectedProgramme?.branches || [];
  const institutionLevels = lockedInstitution && 'levels' in lockedInstitution ? (lockedInstitution as Institution).levels : selectedInstitution?.levels || [];

  // Combine institutions and universities into a single list for display
  const allSchools = [
    ...institutions.map((inst) => ({ id: inst.id, name: inst.name, type: 'institution' as const })),
    ...universities.map((uni) => ({ id: uni.id, name: uni.name, type: 'university' as const })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const data: any = {
          onboarded: true,
        };

        if (institutionId) {
          if (isUniversity) {
            data.universityId = institutionId;
            data.institutionId = null;
          } else {
            data.institutionId = institutionId;
            data.universityId = null;
          }
          if (programmeId) data.programmeId = programmeId;
          if (branchId) data.branchId = branchId;
          if (year) data.year = parseInt(year);
          if (period) data.period = period;
        }

        const res = await fetch('/api/users/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to complete onboarding');
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
        {/* School / Institution */}
        {isLocked ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Institution
            </label>
            <div className="w-full border border-blue-300 dark:border-blue-700 rounded-lg px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="font-medium">{lockedInstitution!.name}</span>
            </div>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              This institution was pre-selected by your join link and cannot be changed.
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Institution <span className="text-red-500">*</span>
            </label>
            <select
              value={institutionId}
              onChange={(e) => {
                setInstitutionId(e.target.value);
                setProgrammeId('');
                setBranchId('');
                setYear('');
                setPeriod('');
              }}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-base"
            >
              <option value="">Select your institution</option>
              {allSchools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
            {allSchools.length === 0 && (
              <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
                <p className="text-amber-700 dark:text-amber-400">
                  No institutions available yet. Please contact an admin to set up your institution.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Programme */}
        {institutionId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Programme
            </label>
            {schoolProgrammes.length > 0 ? (
              <select
                value={programmeId}
                onChange={(e) => {
                  setProgrammeId(e.target.value);
                  setBranchId('');
                }}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-base"
              >
                <option value="">Select your programme</option>
                {schoolProgrammes.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.name}
                    {prog.faculty && ` — ${prog.faculty.name}`}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
                <p className="text-amber-700 dark:text-amber-400">
                  No programmes available for this institution yet. Please contact an admin.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Branch */}
        {programmeId && programmeBranches.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Branch
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-base"
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
        {institutionId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Academic Level
            </label>
            {institutionLevels.length > 0 ? (
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-base"
              >
                <option value="">Select your level</option>
                {institutionLevels.map((level) => (
                  <option key={level.id} value={level.order}>
                    {level.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                No academic levels defined yet.
              </p>
            )}
          </div>
        )}

        {/* Period */}
        {institutionId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-base"
            >
              <option value="">Select your period</option>
              <option value="1">Period 1</option>
              <option value="2">Period 2</option>
              <option value="3">Period 3</option>
            </select>
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

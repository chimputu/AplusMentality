'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, GraduationCap, Building2, BookOpen } from 'lucide-react';

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
}

export default function OnboardingForm({ user, institutions, universities }: OnboardingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Mode: 'institution' (new) or 'university' (legacy)
  const [mode, setMode] = useState<'institution' | 'university'>('institution');

  // Institution mode fields
  const [institutionId, setInstitutionId] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [year, setYear] = useState('');
  const [period, setPeriod] = useState('');

  // Legacy university mode fields
  const [universityId, setUniversityId] = useState('');
  const [uniProgrammeId, setUniProgrammeId] = useState('');
  const [uniBranchId, setUniBranchId] = useState('');
  const [uniYear, setUniYear] = useState('');
  const [uniPeriod, setUniPeriod] = useState('');

  // Profile fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Get selected institution/programmes
  const selectedInstitution = institutions.find((i) => i.id === institutionId);
  const institutionProgrammes = selectedInstitution?.programmes || [];
  const selectedProgramme = institutionProgrammes.find((p) => p.id === programmeId);
  const programmeBranches = selectedProgramme?.branches || [];
  const institutionLevels = selectedInstitution?.levels || [];

  // Get selected university/programmes
  const selectedUniversity = universities.find((u) => u.id === universityId);
  const universityProgrammes = selectedUniversity?.programmes || [];
  const uniSelectedProgramme = universityProgrammes.find((p) => p.id === uniProgrammeId);
  const uniProgrammeBranches = uniSelectedProgramme?.branches || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const data: any = {
          firstName,
          lastName,
          onboarded: true,
        };

        if (mode === 'institution' && institutionId) {
          data.institutionId = institutionId;
          if (programmeId) data.programmeId = programmeId;
          if (branchId) data.branchId = branchId;
          if (year) data.year = parseInt(year);
          if (period) data.period = period;
        } else if (mode === 'university' && universityId) {
          data.universityId = universityId;
          if (uniProgrammeId) data.programmeId = uniProgrammeId;
          if (uniBranchId) data.branchId = uniBranchId;
          if (uniYear) data.year = parseInt(uniYear);
          if (uniPeriod) data.period = uniPeriod;
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
        redirect((role === 'ADMIN' || role === 'SUPER_ADMIN') ? '/admin' : '/student');
      } catch (err: any) {
        console.error('Onboarding error:', err.message);
        alert(err.message || 'Failed to complete onboarding. Please try again.');
      }
    });
  };

  // Import redirect client-side
  const redirect = (url: string) => {
    window.location.href = url;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
      {/* Mode Selector */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          How would you like to set up your profile?
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode('institution')}
            className={`p-4 rounded-xl border-2 transition text-left ${
              mode === 'institution'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
            }`}
          >
            <Building2 className="w-5 h-5 mb-2 text-blue-600" />
            <p className="font-medium text-gray-900 dark:text-gray-100">Institution</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Universities, colleges, polytechnics
            </p>
          </button>
          <button
            type="button"
            onClick={() => setMode('university')}
            className={`p-4 rounded-xl border-2 transition text-left ${
              mode === 'university'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
            }`}
          >
            <GraduationCap className="w-5 h-5 mb-2 text-blue-600" />
            <p className="font-medium text-gray-900 dark:text-gray-100">University</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Legacy university setup
            </p>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              placeholder="John"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              placeholder="Doe"
            />
          </div>
        </div>

        {mode === 'institution' ? (
          <>
            {/* Institution */}
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
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select your institution</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
              {institutions.length === 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1.5">
                  No institutions available yet. Please contact an admin.
                </p>
              )}
            </div>

            {/* Programme */}
            {institutionId && institutionProgrammes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Programme
                </label>
                <select
                  value={programmeId}
                  onChange={(e) => {
                    setProgrammeId(e.target.value);
                    setBranchId('');
                  }}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select your programme</option>
                  {institutionProgrammes.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.name}
                      {prog.faculty && ` — ${prog.faculty.name}`}
                    </option>
                  ))}
                </select>
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
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
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
            {institutionId && institutionLevels.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Academic Level
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select your level</option>
                  {institutionLevels.map((level) => (
                    <option key={level.id} value={level.order}>
                      {level.name}
                    </option>
                  ))}
                </select>
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
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select your period</option>
                  <option value="1">Period 1</option>
                  <option value="2">Period 2</option>
                  <option value="3">Period 3</option>
                </select>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Legacy University */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                University <span className="text-red-500">*</span>
              </label>
              <select
                value={universityId}
                onChange={(e) => {
                  setUniversityId(e.target.value);
                  setUniProgrammeId('');
                  setUniBranchId('');
                  setUniYear('');
                  setUniPeriod('');
                }}
                required
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select your university</option>
                {universities.map((uni) => (
                  <option key={uni.id} value={uni.id}>
                    {uni.name}
                  </option>
                ))}
              </select>
              {universities.length === 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1.5">
                  No universities available yet. Please contact an admin.
                </p>
              )}
            </div>

            {/* Legacy Programme */}
            {universityId && universityProgrammes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Programme
                </label>
                <select
                  value={uniProgrammeId}
                  onChange={(e) => {
                    setUniProgrammeId(e.target.value);
                    setUniBranchId('');
                  }}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select your programme</option>
                  {universityProgrammes.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Legacy Branch */}
            {uniProgrammeId && uniProgrammeBranches.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Branch
                </label>
                <select
                  value={uniBranchId}
                  onChange={(e) => setUniBranchId(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select your branch</option>
                  {uniProgrammeBranches.map((br) => (
                    <option key={br.id} value={br.id}>
                      {br.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Legacy Year */}
            {universityId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Year
                </label>
                <select
                  value={uniYear}
                  onChange={(e) => setUniYear(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select your year</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                  <option value="5">Year 5</option>
                </select>
              </div>
            )}

            {/* Legacy Period */}
            {universityId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Period
                </label>
                <select
                  value={uniPeriod}
                  onChange={(e) => setUniPeriod(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select your period</option>
                  <option value="1">Period 1</option>
                  <option value="2">Period 2</option>
                  <option value="3">Period 3</option>
                </select>
              </div>
            )}
          </>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
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

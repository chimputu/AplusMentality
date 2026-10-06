'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, GraduationCap, Building2 } from 'lucide-react';
import { createProgramme, getFacultiesForInstitution } from '@/lib/actions/programme-crud';
import { toast } from 'sonner';

interface Institution {
  id: string;
  name: string;
  slug: string;
}

interface Faculty {
  id: string;
  name: string;
  code: string;
}

export default function NewProgrammeForm({ institutions }: { institutions: Institution[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [faculties, setFaculties] = useState<Faculty[]>([]);

  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [code, setCode] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [facultyId, setFacultyId] = useState('');

  useEffect(() => {
    if (institutionId) {
      getFacultiesForInstitution(institutionId).then((data) => {
        setFaculties(data);
        setFacultyId('');
      });
    } else {
      setFaculties([]);
    }
  }, [institutionId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        await createProgramme({
          name: name.trim(),
          shortName: shortName.trim() || undefined,
          code: code.trim() || undefined,
          institutionId,
          facultyId: facultyId || undefined,
        });
        toast.success('Programme created successfully');
        router.push('/admin/programmes');
      } catch (err: any) {
        toast.error(err.message || 'Failed to create programme');
      }
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <Link
          href="/admin/programmes"
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Programmes
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Add Programme</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          Create a new academic programme for an institution.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Institution */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            <Building2 className="w-4 h-4 inline mr-1" />
            Institution <span className="text-red-500">*</span>
          </label>
          <select
            value={institutionId}
            onChange={(e) => setInstitutionId(e.target.value)}
            required
            disabled={isPending}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50"
          >
            <option value="">Select institution</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>
        </div>

        {/* Faculty */}
        {institutionId && faculties.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Faculty
            </label>
            <select
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
              disabled={isPending}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50"
            >
              <option value="">No faculty</option>
              {faculties.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name} ({fac.code})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Programme Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            <GraduationCap className="w-4 h-4 inline mr-1" />
            Programme Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isPending}
            placeholder="e.g. BSc Computer Science"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50"
          />
        </div>

        {/* Short Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Short Name
          </label>
          <input
            type="text"
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            disabled={isPending}
            placeholder="e.g. BSc CS"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50"
          />
        </div>

        {/* Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isPending}
            placeholder="e.g. BSC-CS"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Must be unique within the selected institution.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/admin/programmes"
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 inline-flex items-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <GraduationCap className="w-4 h-4" />
                Create Programme
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

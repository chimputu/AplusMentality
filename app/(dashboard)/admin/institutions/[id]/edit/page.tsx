'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { updateInstitution } from '@/lib/actions/institution-crud';
import { toast } from 'sonner';

const INSTITUTION_TYPES = [
  { value: 'UNIVERSITY', label: 'University' },
  { value: 'COLLEGE', label: 'College' },
  { value: 'POLYTECHNIC', label: 'Polytechnic' },
  { value: 'INSTITUTE', label: 'Institute' },
  { value: 'MEDICAL_SCHOOL', label: 'Medical School' },
  { value: 'BUSINESS_SCHOOL', label: 'Business School' },
  { value: 'TECHNICAL_COLLEGE', label: 'Technical College' },
  { value: 'VOCATIONAL_SCHOOL', label: 'Vocational School' },
];

const LEVEL_TYPES = [
  { value: 'YEAR', label: 'Year' },
  { value: 'STAGE', label: 'Stage' },
  { value: 'PHASE', label: 'Phase' },
  { value: 'GRADE', label: 'Grade' },
];

const PERIOD_TYPES = [
  { value: 'SEMESTER', label: 'Semester' },
  { value: 'TERM', label: 'Term' },
  { value: 'TRIMESTER', label: 'Trimester' },
  { value: 'QUARTER', label: 'Quarter' },
  { value: 'BLOCK', label: 'Block' },
];

interface EditInstitutionPageProps {
  institution: any;
}

function EditInstitutionPage({ institution }: EditInstitutionPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(institution.name);
  const [shortName, setShortName] = useState(institution.shortName || '');
  const [type, setType] = useState(institution.type);
  const [description, setDescription] = useState(institution.description || '');
  const [country, setCountry] = useState(institution.country || 'Zambia');
  const [province, setProvince] = useState(institution.province || '');
  const [city, setCity] = useState(institution.city || '');
  const [website, setWebsite] = useState(institution.website || '');
  const [email, setEmail] = useState(institution.email || '');
  const [phone, setPhone] = useState(institution.phone || '');
  const [levelType, setLevelType] = useState(institution.levelType);
  const [numLevels, setNumLevels] = useState(institution.numLevels);
  const [periodType, setPeriodType] = useState(institution.periodType);
  const [numPeriods, setNumPeriods] = useState(institution.numPeriods);
  const [hasFaculties, setHasFaculties] = useState(institution.hasFaculties);
  const [hasBranches, setHasBranches] = useState(institution.hasBranches);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        await updateInstitution(institution.id, {
          name,
          shortName: shortName || undefined,
          type,
          description: description || undefined,
          country,
          province: province || undefined,
          city: city || undefined,
          website: website || undefined,
          email: email || undefined,
          phone: phone || undefined,
          levelType,
          numLevels,
          periodType,
          numPeriods,
          hasFaculties,
          hasBranches,
        });

        toast.success('Institution updated successfully');
        router.push(`/admin/institutions/${institution.id}`);
      } catch (err: any) {
        toast.error(err.message || 'Failed to update institution');
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/institutions/${institution.id}`}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Details
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Edit Institution
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">
          Update {institution.name}&apos;s information.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Institution Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Short Name
              </label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                {INSTITUTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Location */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Province
              </label>
              <input
                type="text"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Contact Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Academic Structure */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Academic Structure
          </h2>
          <p className="text-sm text-amber-600 dark:text-amber-400">
            ⚠️ Changing the level type, number of levels, period type, or number of periods will
            regenerate all academic levels and periods.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Level Type
              </label>
              <select
                value={levelType}
                onChange={(e) => setLevelType(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                {LEVEL_TYPES.map((lt) => (
                  <option key={lt.value} value={lt.value}>
                    {lt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Number of Levels (1-10)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={numLevels}
                onChange={(e) => setNumLevels(parseInt(e.target.value) || 1)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Period Type
              </label>
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                {PERIOD_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Number of Periods (1-12)
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={numPeriods}
                onChange={(e) => setNumPeriods(parseInt(e.target.value) || 1)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasFaculties}
                onChange={(e) => setHasFaculties(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Has Faculties</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasBranches}
                onChange={(e) => setHasBranches(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Has Branches</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href={`/admin/institutions/${institution.id}`}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 inline-flex items-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// Server component wrapper to fetch data
export default async function EditInstitutionPageWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { getInstitution } = await import('@/lib/actions/institution-crud');
  const institution = await getInstitution(id);

  if (!institution) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Institution not found.</p>
        <Link
          href="/admin/institutions"
          className="text-blue-600 hover:underline text-sm"
        >
          Back to Institutions
        </Link>
      </div>
    );
  }

  return <EditInstitutionPage institution={institution} />;
}

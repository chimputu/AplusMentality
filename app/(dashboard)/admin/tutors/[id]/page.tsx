import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import TutorImageUploader from '@/components/tutor-image-uploader';
import { updateTutor } from '@/lib/actions/tutor-crud';
import { revalidatePath } from 'next/cache';

export default async function AdminTutorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let tutor: any = null;
  try {
    tutor = await prisma.tutor.findUnique({
      where: { id },
      include: {
        university: true,
        programme: true,
        branch: true,
        specialties: { include: { course: true } },
        _count: { select: { requests: true } },
      },
    });
  } catch (err) {
    console.error('[AdminTutorDetail] Failed to fetch tutor:', err);
  }

  if (!tutor) {
    notFound();
  }

  const handleUpdate = async (formData: FormData) => {
    await updateTutor(id, {
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      bio: formData.get('bio') as string,
      universityId: (formData.get('universityId') as string) || null,
      programmeId: (formData.get('programmeId') as string) || null,
      branchId: (formData.get('branchId') as string) || null,
      yearsExperience: Number(formData.get('yearsExperience')),
      availability: formData.get('availability') as string,
      mode: formData.get('mode') as string,
      contactVia: formData.get('contactVia') as string,
      isVerified: formData.get('isVerified') === 'on',
      isActive: formData.get('isActive') === 'on',
    });
    revalidatePath(`/admin/tutors/${id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/tutors"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tutors
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {tutor.fullName}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {tutor.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tutor.isVerified && (
            <span className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
              <CheckCircle className="w-3 h-3" />
              Verified
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
              tutor.isActive
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}
          >
            {tutor.isActive ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            {tutor.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Photo upload */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Profile Photo
          </h2>
          <TutorImageUploader tutorId={tutor.id} currentUrl={tutor.avatarUrl} />
        </div>

        {/* Right column - Editable form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Personal Information
            </h2>
            <form action={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    name="fullName"
                    type="text"
                    defaultValue={tutor.fullName}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={tutor.email}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Phone
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={tutor.phone || ''}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Years of Experience
                  </label>
                  <input
                    name="yearsExperience"
                    type="number"
                    min={0}
                    max={60}
                    defaultValue={tutor.yearsExperience}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Bio
                </label>
                <textarea
                  name="bio"
                  rows={3}
                  defaultValue={tutor.bio || ''}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2">
                  <input
                    name="isVerified"
                    type="checkbox"
                    defaultChecked={tutor.isVerified}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Verified</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    name="isActive"
                    type="checkbox"
                    defaultChecked={tutor.isActive}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Save Changes
              </button>
            </form>
          </div>

          {/* Availability & Mode */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Availability & Mode
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Mode
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 capitalize">
                  {tutor.mode}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Contact Via
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 capitalize">
                  {tutor.contactVia}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Availability
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {tutor.availability || 'Not set'}
                </p>
              </div>
            </div>
          </div>

          {/* Academic Affiliation */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Academic Affiliation
            </h2>
            <div className="space-y-2">
              {tutor.university && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">University:</span>{' '}
                  {tutor.university.name} ({tutor.university.code})
                </p>
              )}
              {tutor.programme && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Programme:</span> {tutor.programme.name}
                </p>
              )}
              {tutor.branch && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Branch:</span> {tutor.branch.name}
                </p>
              )}
            </div>
          </div>

          {/* Specialties */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Course Specialties
            </h2>
            {tutor.specialties.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No specialties assigned yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tutor.specialties.map((s: any) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                  >
                    {s.course.code} - {s.course.title}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Activity
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MessageSquare className="w-4 h-4" />
              {tutor._count.requests} requests received
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

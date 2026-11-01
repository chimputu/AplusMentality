'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  GraduationCap,
  Building2,
  BookOpen,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  Edit,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  year: number | null;
  period: string | null;
  institutionId: string | null;
  universityId: string | null;
  programmeId: string | null;
  branchId: string | null;
  institution: { name: string; shortName?: string | null; logoUrl?: string | null } | null;
  university: { name: string } | null;
  programme: { name: string; code?: string | null } | null;
  branch: { name: string } | null;
}

interface Institution {
  id: string;
  name: string;
  shortName: string | null;
  type: string;
  slug: string;
}

interface Programme {
  id: string;
  name: string;
  code: string | null;
  faculty: { name: string; code: string } | null;
}

interface ChangeRequest {
  id: string;
  status: string;
  reason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  adminNotes: string | null;
  currentInstitution: { name: string; shortName?: string | null } | null;
  newInstitution: { name: string; shortName?: string | null } | null;
  currentProgramme: { name: string } | null;
  newProgramme: { name: string } | null;
  currentYear: number | null;
  newYear: number | null;
}

export default function StudentProfilePage() {
  const { user } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [fetchingProgrammes, setFetchingProgrammes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Change request form state
  const [newInstitutionId, setNewInstitutionId] = useState('');
  const [newProgrammeId, setNewProgrammeId] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newPeriod, setNewPeriod] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchInstitutions();
    fetchChangeRequests();
    
    // Poll for profile changes every 30 seconds to detect admin approvals
    const interval = setInterval(() => {
      fetchProfile();
      fetchChangeRequests();
    }, 30_000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (newInstitutionId) {
      fetchProgrammes(newInstitutionId);
      setNewProgrammeId('');
    }
  }, [newInstitutionId]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/users/me');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const res = await fetch('/api/institutions/picker');
      if (res.ok) {
        const data = await res.json();
        setInstitutions(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch institutions:', err);
    }
  };

  const fetchProgrammes = async (institutionId: string) => {
    setFetchingProgrammes(true);
    try {
      const res = await fetch(`/api/institutions/${institutionId}/programmes`);
      if (res.ok) {
        const data = await res.json();
        setProgrammes(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch programmes:', err);
    } finally {
      setFetchingProgrammes(false);
    }
  };

  const fetchChangeRequests = async () => {
    try {
      const res = await fetch('/api/institution-change-request');
      if (res.ok) {
        const data = await res.json();
        const newRequests = (data.requests || []) as ChangeRequest[];
        
        // Check if any previously pending request was just approved
        const hadPending = changeRequests.some((r) => r.status === 'PENDING');
        const nowApproved = newRequests.some((r) => r.status === 'APPROVED') && hadPending;
        
        setChangeRequests(newRequests);
        
        // If a request was just approved, refresh the profile immediately
        if (nowApproved) {
          await fetchProfile();
        }
      }
    } catch (err) {
      console.error('Failed to fetch change requests:', err);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const body: any = { newInstitutionId, reason };
      if (newProgrammeId) body.newProgrammeId = newProgrammeId;
      if (newYear) body.newYear = parseInt(newYear);
      if (newPeriod) body.newPeriod = newPeriod;

      const res = await fetch('/api/institution-change-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to submit request');
      }

      setSuccess(true);
      setShowForm(false);
      setNewInstitutionId('');
      setNewProgrammeId('');
      setNewYear('');
      setNewPeriod('');
      setReason('');
      fetchChangeRequests();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const getCurrentSchoolName = () => {
    return profile?.institution?.name || 'Not set';
  };

  const getCurrentSchoolLogo = () => {
    return profile?.institution?.logoUrl || null;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <X className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            View your academic details and manage your institution
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            <Edit className="w-4 h-4" />
            Change Institution
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Change request submitted successfully! An admin will review it soon.
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Personal Info Card */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-500" />
          My Institution
        </h2>

        <div className="flex items-start gap-4">
          {getCurrentSchoolLogo() ? (
            <img
              src={getCurrentSchoolLogo()!}
              alt={getCurrentSchoolName()}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-8 h-8 text-blue-500" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {getCurrentSchoolName()}
            </p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile?.programme?.name && (
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Programme:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {profile.programme.name}
                  </span>
                </div>
              )}
              {profile?.year && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Year:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    Year {profile.year}
                  </span>
                </div>
              )}
              {profile?.period && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Period:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    Period {profile.period}
                  </span>
                </div>
              )}
              {profile?.branch?.name && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Branch:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {profile.branch.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Change Request Form */}
      {showForm && (
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-500" />
              Request Institution Change
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setError('');
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>Note:</strong> Your change request will be reviewed by an admin. You will keep your current institution until the request is approved.
            </p>
          </div>

          <form onSubmit={handleSubmitRequest} className="space-y-4">
            {/* Institution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Institution <span className="text-red-500">*</span>
              </label>
              <select
                value={newInstitutionId}
                onChange={(e) => setNewInstitutionId(e.target.value)}
                required
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="">Select your institution</option>
                {institutions
                  .filter((inst) => inst.id !== profile?.institutionId)
                  .map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Programme */}
            {newInstitutionId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Programme (optional)
                </label>
                {fetchingProgrammes ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading programmes...
                  </div>
                ) : (
                  <select
                    value={newProgrammeId}
                    onChange={(e) => setNewProgrammeId(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="">Select programme (optional)</option>
                    {programmes.map((prog) => (
                      <option key={prog.id} value={prog.id}>
                        {prog.faculty ? `${prog.faculty.name} - ` : ''}
                        {prog.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Year & Period */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Year (optional)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Period (optional)
                </label>
                <select
                  value={newPeriod}
                  onChange={(e) => setNewPeriod(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="">Select period</option>
                  <option value="1">Period 1</option>
                  <option value="2">Period 2</option>
                  <option value="3">Period 3</option>
                </select>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason for change (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Why do you want to change your institution?"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || !newInstitutionId}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Request
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError('');
                }}
                className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Change Request History */}
      {changeRequests.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Change Request History
          </h2>

          <div className="space-y-4">
            {changeRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(req.status)}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(req.createdAt).toLocaleDateString('en-ZM', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="text-sm space-y-1">
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-gray-900 dark:text-gray-100">From:</span>{' '}
                    {req.currentInstitution?.name || 'Not set'}
                    {req.currentProgramme?.name ? ` (${req.currentProgramme.name})` : ''}
                    {req.currentYear ? `, Year ${req.currentYear}` : ''}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-gray-900 dark:text-gray-100">To:</span>{' '}
                    {req.newInstitution?.name || 'Not set'}
                    {req.newProgramme?.name ? ` (${req.newProgramme.name})` : ''}
                    {req.newYear ? `, Year ${req.newYear}` : ''}
                  </p>
                  {req.reason && (
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Reason:</span>{' '}
                      {req.reason}
                    </p>
                  )}
                  {req.adminNotes && (
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Admin notes:</span>{' '}
                      {req.adminNotes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

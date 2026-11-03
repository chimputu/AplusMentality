'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Search } from 'lucide-react';
import { toast } from 'sonner';

interface ChangeRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string | null;
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    institutionId: string | null;
    programmeId: string | null;
    year: number | null;
    period: string | null;
  };
  currentInstitution: { id: string; name: string; shortName: string } | null;
  newInstitution: { id: string; name: string; shortName: string } | null;
  currentProgramme: { id: string; name: string } | null;
  newProgramme: { id: string; name: string } | null;
  newYear: number | null;
  newPeriod: string | null;
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const statusIcons = {
  PENDING: <Clock className="w-4 h-4" />,
  APPROVED: <CheckCircle className="w-4 h-4" />,
  REJECTED: <XCircle className="w-4 h-4" />,
};

export default function AdminChangeRequestsPage() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  async function fetchRequests() {
    try {
      const res = await fetch(`/api/institution-change-request/admin?status=${filter}`);
      const data = await res.json();
      if (res.ok) {
        setRequests(data.requests || []);
      } else {
        toast.error(data.error || 'Failed to fetch requests');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(requestId: string, status: 'APPROVED' | 'REJECTED') {
    if (processing) return;
    setProcessing(requestId);

    try {
      const res = await fetch('/api/institution-change-request/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          status,
          adminNotes: status === 'REJECTED' ? 'Rejected by admin' : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Request ${status.toLowerCase()} successfully`);
        fetchRequests();
      } else {
        toast.error(data.error || `Failed to ${status.toLowerCase()} request`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to process request');
    } finally {
      setProcessing(null);
    }
  }

  const filteredRequests = requests.filter((req) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      req.user.name?.toLowerCase().includes(q) ||
      req.user.email.toLowerCase().includes(q) ||
      req.currentInstitution?.name.toLowerCase().includes(q) ||
      req.newInstitution?.name.toLowerCase().includes(q)
    );
  });

  const counts = {
    ALL: requests.length,
    PENDING: requests.filter((r) => r.status === 'PENDING').length,
    APPROVED: requests.filter((r) => r.status === 'APPROVED').length,
    REJECTED: requests.filter((r) => r.status === 'REJECTED').length,
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Change Requests</h1>
          <p className="text-gray-600 dark:text-muted-foreground text-sm">
            Review and manage student institution change requests
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Change Requests</h1>
        <p className="text-gray-600 dark:text-muted-foreground text-sm">
          Review and manage student institution change requests
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => { setFilter(status); setLoading(true); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-muted dark:text-foreground dark:hover:bg-muted'
              }`}
            >
              {status} ({counts[status as keyof typeof counts]})
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or institution..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Empty state */}
      {filteredRequests.length === 0 && (
        <div className="text-center py-16 bg-muted rounded-xl">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-foreground mb-2">
            No Change Requests
          </h3>
          <p className="text-muted-foreground">
            {filter === 'ALL'
              ? 'No institution change requests have been submitted yet.'
              : `No ${filter.toLowerCase()} change requests found.`}
          </p>
        </div>
      )}

      {/* Requests list */}
      <div className="space-y-4">
        {filteredRequests.map((req) => (
          <div
            key={req.id}
            className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition"
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              {/* Student info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {req.user.name?.charAt(0)?.toUpperCase() || req.user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {req.user.name || 'Unnamed Student'}
                    </h3>
                    <p className="text-sm text-muted-foreground">{req.user.email}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusColors[req.status]}`}>
                    {statusIcons[req.status]}
                    {req.status}
                  </span>
                </div>

                {/* Change details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="p-3 bg-gray-50 dark:bg-input/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Current Institution</p>
                    <p className="font-medium text-foreground">
                      {req.currentInstitution?.name || 'None'}
                    </p>
                    {req.currentProgramme && (
                      <p className="text-sm text-gray-600 dark:text-muted-foreground">{req.currentProgramme.name}</p>
                    )}
                    {req.user.year && (
                      <p className="text-sm text-gray-600 dark:text-muted-foreground">
                        Year {req.user.year} {req.user.period && `• ${req.user.period}`}
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Requested Change</p>
                    <p className="font-medium text-foreground">
                      {req.newInstitution?.name || 'None'}
                    </p>
                    {req.newProgramme && (
                      <p className="text-sm text-gray-600 dark:text-muted-foreground">{req.newProgramme.name}</p>
                    )}
                    {req.newYear && (
                      <p className="text-sm text-gray-600 dark:text-muted-foreground">
                        Year {req.newYear} {req.newPeriod && `• ${req.newPeriod}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Reason */}
                {req.reason && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-input/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Reason</p>
                    <p className="text-sm text-gray-700 dark:text-foreground">{req.reason}</p>
                  </div>
                )}

                {/* Meta info */}
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>Submitted: {new Date(req.createdAt).toLocaleDateString()}</span>
                  {req.reviewedAt && (
                    <span>Reviewed: {new Date(req.reviewedAt).toLocaleDateString()}</span>
                  )}
                  {req.adminNotes && <span>Notes: {req.adminNotes}</span>}
                </div>
              </div>

              {/* Actions */}
              {req.status === 'PENDING' && (
                <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleAction(req.id, 'APPROVED')}
                    disabled={processing !== null}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(req.id, 'REJECTED')}
                    disabled={processing !== null}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

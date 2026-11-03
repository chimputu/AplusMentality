'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  Check,
  X,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import {
  approveTutorApplication,
  rejectTutorApplication,
  requestMoreInfo,
} from '@/lib/actions/tutor-application';
import { formatDate } from '@/lib/date-format';

interface Application {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  experienceYears: number;
  cvUrl: string | null;
  status: string;
  adminNotes: string | null;
  rejectionReason: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    imageUrl: string | null;
  };
  institution: { id: string; name: string; shortName: string | null } | null;
}

interface Props {
  applications: Application[];
  total: number;
}

const statusBadge = (status: string) => {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', label: 'Pending' },
    UNDER_REVIEW: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Under Review' },
    APPROVED: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Approved' },
    REJECTED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Rejected' },
    WITHDRAWN: { bg: 'bg-muted', text: 'text-gray-600 dark:text-muted-foreground', label: 'Withdrawn' },
  };
  const c = config[status] || config.PENDING;
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
};

export default function ApplicationTable({ applications, total }: Props) {
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      await approveTutorApplication({ applicationId: id });
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to approve');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async () => {
    if (!showRejectDialog) {
      setShowRejectDialog(true);
      return;
    }
    if (actionId) {
      setActionId(actionId);
      try {
        await rejectTutorApplication({ applicationId: actionId, rejectionReason: rejectReason });
        window.location.reload();
      } catch (err: any) {
        alert(err.message || 'Failed to reject');
      } finally {
        setActionId(null);
        setShowRejectDialog(false);
      }
    }
  };

  const handleRequestInfo = async () => {
    if (!showInfoDialog) {
      setShowInfoDialog(true);
      return;
    }
    if (actionId) {
      setActionId(actionId);
      try {
        await requestMoreInfo({ applicationId: actionId, adminNotes: infoMessage });
        window.location.reload();
      } catch (err: any) {
        alert(err.message || 'Failed to request info');
      } finally {
        setActionId(null);
        setShowInfoDialog(false);
      }
    }
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Applicant</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">Institution</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden sm:table-cell">Experience</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden lg:table-cell">Submitted</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id} className="border-b border-gray-100 dark:border-border hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-foreground">{app.fullName}</p>
                    <p className="text-xs text-muted-foreground">{app.email}</p>
                  </div>
                </td>
                <td className="py-3 px-4 hidden md:table-cell text-gray-600 dark:text-foreground">
                  {app.institution?.shortName || app.institution?.name || '—'}
                </td>
                <td className="py-3 px-4 hidden sm:table-cell text-gray-600 dark:text-foreground">
                  {app.experienceYears} yrs
                </td>
                <td className="py-3 px-4">{statusBadge(app.status)}</td>
                <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground text-xs">
                  {formatDate(app.submittedAt)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/tutor-applications/${app.id}`}
                      className="p-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    {(app.status === 'PENDING' || app.status === 'UNDER_REVIEW') && (
                      <>
                        <button
                          onClick={() => { setActionId(app.id); handleApprove(app.id); }}
                          disabled={actionId === app.id}
                          className="p-1.5 text-gray-500 hover:text-green-600 dark:hover:text-green-400 disabled:opacity-50"
                          title="Approve"
                        >
                          {actionId === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => { setActionId(app.id); handleReject(); }}
                          disabled={actionId === app.id}
                          className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setActionId(app.id); handleRequestInfo(); }}
                          disabled={actionId === app.id}
                          className="p-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50"
                          title="Request info"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reject dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Reject Application
            </h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-border bg-white dark:bg-input text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Provide a detailed reason for rejection..."
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="px-4 py-2 text-gray-600 dark:text-muted-foreground hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejectReason.length < 10}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request info dialog */}
      {showInfoDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Request More Information
            </h3>
            <textarea
              value={infoMessage}
              onChange={(e) => setInfoMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-border bg-white dark:bg-input text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Specify what additional information is needed..."
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setShowInfoDialog(false)}
                className="px-4 py-2 text-gray-600 dark:text-muted-foreground hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestInfo}
                disabled={infoMessage.length < 10}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

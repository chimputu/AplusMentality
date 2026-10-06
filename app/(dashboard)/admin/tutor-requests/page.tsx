'use client';

import { useState, useEffect } from 'react';
import { Filter, Mail, Phone } from 'lucide-react';

interface Request {
  id: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string | null;
  courseNeeded: string | null;
  sessionType: string;
  quotedRate: number | null;
  message: string;
  status: string;
  createdAt: string;
  tutor: { fullName: string; email: string };
}

export default function AdminTutorRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/tutor-requests?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
      setLoading(false);
    }
    load();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tutor Requests</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Student requests for tutoring sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONTACTED">Contacted</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
            >
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No tutor requests yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {req.studentName}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {req.studentEmail}
                    </span>
                    {req.studentPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {req.studentPhone}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                    req.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : req.status === 'CONTACTED'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {req.status}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Tutor:</span>{' '}
                  <span className="text-gray-900 dark:text-gray-100">{req.tutor.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Course:</span>{' '}
                  <span className="text-gray-900 dark:text-gray-100">{req.courseNeeded || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Type:</span>{' '}
                  <span className="text-gray-900 dark:text-gray-100">{req.sessionType}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Rate:</span>{' '}
                  <span className="text-gray-900 dark:text-gray-100">
                    {req.quotedRate ? `${req.quotedRate} ZMW` : 'Not specified'}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                {req.message}
              </p>

              <p className="mt-2 text-xs text-gray-400">
                {new Date(req.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

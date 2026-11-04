'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Loader2, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  role: string;
  institutionId: string | null;
  institution?: { name: string } | null;
}

export default function AddLecturerPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const searchUsers = async (term: string) => {
    if (term.length < 2) {
      setUsers([]);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/search?query=${encodeURIComponent(term)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        setError('Failed to search users');
      }
    } catch {
      setError('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchUsers(value);
  };

  const promoteToLecturer = async (user: User) => {
    if (user.role === 'LECTURER') {
      toast.info('User is already a Lecturer');
      return;
    }
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      toast.error('Cannot promote a user with equal or higher privileges');
      return;
    }
    setPromoting(user.clerkId);
    try {
      const res = await fetch('/api/users/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: user.clerkId,
          newRole: 'LECTURER',
        }),
      });

      if (res.ok) {
        toast.success(`${user.name || user.email} has been promoted to Lecturer`);
        setUsers((prev) =>
          prev.map((u) => (u.clerkId === user.clerkId ? { ...u, role: 'LECTURER' } : u))
        );
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to promote user');
      }
    } catch {
      toast.error('Failed to promote user');
    } finally {
      setPromoting(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      STUDENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      TUTOR: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      LECTURER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      ADMIN: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      SUPER_ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${colors[role] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/lecturers"
          className="p-2 hover:bg-muted rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add Lecturer</h1>
          <p className="text-sm text-muted-foreground">
            Search for a user and promote them to Lecturer role
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {users.length > 0 && (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg bg-card"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {user.name || user.email.split('@')[0]}
                  </p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.institution && (
                    <p className="text-xs text-gray-400">{user.institution.name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getRoleBadge(user.role)}
                {user.role === 'LECTURER' ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    Already Lecturer
                  </span>
                ) : (
                  <button
                    onClick={() => promoteToLecturer(user)}
                    disabled={promoting === user.clerkId || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {promoting === user.clerkId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    Promote
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && searchTerm.length >= 2 && users.length === 0 && (
        <div className="text-center py-12">
          <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No users found matching "{searchTerm}"</p>
        </div>
      )}

      {!searchTerm && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Enter a name or email to search for users</p>
        </div>
      )}
    </div>
  );
}

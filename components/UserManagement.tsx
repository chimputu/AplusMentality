'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Calendar,
  ShieldCheck,
  Trash2,
  Search,
  BookOpen,
  Video,
  FileQuestion,
  Award,
  UserX,
  Users,
  GraduationCap,
  AtSign,
  Building2,
  Pencil,
  X,
  Check,
  RefreshCw,
} from 'lucide-react';
import { formatDate } from '@/lib/formatDate';
import { toast } from 'sonner';
import type { Role } from '@/generated/prisma/client';
import ConfirmModal from '@/components/ui/confirm-modal';

interface User {
  id: string;
  clerkId: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  imageUrl: string | null;
  role: Role;
  institutionId: string | null;
  programmeId: string | null;
  year: number | null;
  period: string | null;
  onboarded: boolean;
  institution?: { id: string; name: string; shortName: string } | null;
  createdAt: string;
  enrollments?: any[];
  courses?: any[];
  _count?: {
    enrollments: number;
    courses: number;
    announcements: number;
    videos: number;
    quizzes: number;
    tests: number;
    assignments: number;
  };
}

interface Institution {
  id: string;
  name: string;
  shortName: string;
}

interface UserManagementProps {
  users: User[];
  institutions?: Institution[];
}

/** Consistent display name with fallback chain: username → name → email prefix */
function getDisplayName(user: User): string {
  if (user.username) return `@${user.username}`;
  if (user.name) return user.name;
  return user.email.split('@')[0];
}

/** Real name for subtext, only if different from the display name */
function getSecondaryName(user: User): string | null {
  if (!user.username && !user.name) return null;
  const real = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  if (real && real !== user.name) return real;
  if (user.name && user.username) return user.name;
  return null;
}

export default function UserManagement({ users, institutions = [] }: UserManagementProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | Role>('ALL');
  const [filterInstitution, setFilterInstitution] = useState('ALL');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ role: '', institutionId: '', year: '', period: '' });
  const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: string; role: Role; displayName: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ userId: string; displayName: string } | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const safeUsers = users ?? [];

  const handleRoleChangeClick = (user: User, newRole: Role) => {
    setPendingRoleChange({ userId: user.clerkId, role: newRole, displayName: getDisplayName(user) });
  };

  const handleRoleChangeConfirm = async () => {
    if (!pendingRoleChange) return;
    const { userId, role } = pendingRoleChange;
    setPendingRoleChange(null);
    setUpdating(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (res.ok) {
        toast.success('User role updated');
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('An error occurred');
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUserClick = (user: User) => {
    setPendingDelete({ userId: user.clerkId, displayName: getDisplayName(user) });
  };

  const handleDeleteUserConfirm = async () => {
    if (!pendingDelete) return;
    const { userId } = pendingDelete;
    setPendingDelete(null);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('User deleted');
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('An error occurred');
    }
  };

  const handleSyncRole = async (user: User) => {
    setSyncing(user.clerkId);
    try {
      const res = await fetch('/api/users/sync-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.clerkId }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Role synced to Clerk (${data.role})`);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to sync role');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('An error occurred');
    } finally {
      setSyncing(null);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      role: user.role,
      institutionId: user.institutionId || '',
      year: user.year?.toString() || '',
      period: user.period || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setUpdating(editingUser.clerkId);
    try {
      const body: any = { role: editForm.role };
      if (editForm.institutionId) body.institutionId = editForm.institutionId;
      else body.institutionId = null;
      if (editForm.year) body.year = parseInt(editForm.year);
      else body.year = null;
      if (editForm.period) body.period = editForm.period;
      else body.period = null;

      const res = await fetch(`/api/users/${editingUser.clerkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success('User updated successfully');
        setEditingUser(null);
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Edit error:', error);
      toast.error('An error occurred');
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = safeUsers.filter((user) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (user.name?.toLowerCase() || '').includes(q) ||
      (user.username?.toLowerCase() || '').includes(q) ||
      (user.firstName?.toLowerCase() || '').includes(q) ||
      (user.lastName?.toLowerCase() || '').includes(q) ||
      user.email.toLowerCase().includes(q);

    const matchesRole = filterRole === 'ALL' || user.role === filterRole;
    const matchesInstitution = filterInstitution === 'ALL' || user.institutionId === filterInstitution;

    return matchesSearch && matchesRole && matchesInstitution;
  });

  const stats = {
    total: safeUsers.length,
    admins: safeUsers.filter((u) => u.role === 'ADMIN').length,
    students: safeUsers.filter((u) => u.role === 'STUDENT').length,
  };

  const totalEnrollments = safeUsers.reduce((acc, u) => acc + (u._count?.enrollments || 0), 0);

  if (safeUsers.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/50 rounded-xl">
        <Users className="w-16 h-16 text-foreground dark:text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground">No users found</h3>
        <p className="text-muted-foreground text-sm mt-1">Users will appear here once they sign up.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Admins</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.admins}</p>
            </div>
            <ShieldCheck className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Students</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.students}</p>
            </div>
            <GraduationCap className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Enrollments</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalEnrollments}</p>
            </div>
            <BookOpen className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search by username, name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-card text-foreground"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterRole('ALL')}
            className={`px-4 py-2 rounded-lg transition ${
              filterRole === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-muted text-muted-foreground dark:text-foreground hover:bg-muted '
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterRole('ADMIN')}
            className={`px-4 py-2 rounded-lg transition ${
              filterRole === 'ADMIN'
                ? 'bg-purple-600 text-foreground'
                : 'bg-muted text-muted-foreground dark:text-foreground hover:bg-muted '
            }`}
          >
            <ShieldCheck className="w-4 h-4 inline mr-1" />
            Admins
          </button>
          <button
            onClick={() => setFilterRole('STUDENT')}
            className={`px-4 py-2 rounded-lg transition ${
              filterRole === 'STUDENT'
                ? 'bg-blue-600 text-white'
                : 'bg-muted text-muted-foreground dark:text-foreground hover:bg-muted '
            }`}
          >
            <GraduationCap className="w-4 h-4 inline mr-1" />
            Students
          </button>
          {institutions.length > 0 && (
            <select
              value={filterInstitution}
              onChange={(e) => setFilterInstitution(e.target.value)}
              className="px-4 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Filter by institution"
            >
              <option value="ALL">All Institutions</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.shortName || inst.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Institution</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => {
                const displayName = getDisplayName(user);
                const secondaryName = getSecondaryName(user);

                return (
                  <tr key={user.id} className="hover:bg-muted /50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.imageUrl}
                            alt={displayName}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 bg-muted  rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium text-muted-foreground dark:text-foreground">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {user.username ? (
                              <span className="inline-flex items-center gap-1">
                                <AtSign className="w-3 h-3 text-muted-foreground" />
                                {user.username}
                              </span>
                            ) : (
                              displayName
                            )}
                          </p>
                          {secondaryName && (
                            <p className="text-xs text-muted-foreground truncate">
                              {secondaryName}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground truncate">
                            {user.clerkId.substring(0, 12)}…
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground dark:text-foreground truncate">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground dark:text-foreground truncate">
                          {user.institution?.shortName || user.institution?.name || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      }`}>
                        {user.role === 'ADMIN' ? (
                          <ShieldCheck className="w-3 h-3 inline mr-1" />
                        ) : (
                          <GraduationCap className="w-3 h-3 inline mr-1" />
                        )}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {user._count?.enrollments || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          {user._count?.videos || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileQuestion className="w-3 h-3" />
                          {(user._count?.quizzes || 0) + (user._count?.tests || 0)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <Calendar className="w-4 h-4" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition"
                          aria-label={`Edit ${getDisplayName(user)}`}
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                        {user.role === 'ADMIN' ? (
                          <button
                            onClick={() => handleRoleChangeClick(user, 'STUDENT')}
                            disabled={updating === user.clerkId}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 rounded-lg transition disabled:opacity-50"
                          >
                            <UserX className="w-3 h-3" />
                            Demote
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRoleChangeClick(user, 'ADMIN')}
                            disabled={updating === user.clerkId}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition disabled:opacity-50"
                          >
                            <Award className="w-3 h-3" />
                            Promote
                          </button>
                        )}
                        <button
                          onClick={() => handleSyncRole(user)}
                          disabled={syncing === user.clerkId}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition disabled:opacity-50"
                          title="Sync role to Clerk"
                        >
                          <RefreshCw className={`w-3 h-3 ${syncing === user.clerkId ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleDeleteUserClick(user)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditingUser(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Edit User</h2>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {editingUser.name || editingUser.email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="STUDENT">Student</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="LECTURER">Lecturer</option>
                  <option value="TUTOR">Tutor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Institution
                </label>
                <select
                  value={editForm.institutionId}
                  onChange={(e) => setEditForm({ ...editForm, institutionId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No Institution</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.shortName || inst.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editForm.year}
                    onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                    placeholder="e.g. 1"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Period
                  </label>
                  <input
                    type="text"
                    value={editForm.period}
                    onChange={(e) => setEditForm({ ...editForm, period: e.target.value })}
                    placeholder="e.g. 2024/2025"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={updating === editingUser.clerkId}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {updating === editingUser.clerkId ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Confirmation Modal */}
      <ConfirmModal
        open={pendingRoleChange !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRoleChange(null);
        }}
        title="Change Role?"
        description={
          pendingRoleChange
            ? `Are you sure you want to change ${pendingRoleChange.displayName}'s role to ${pendingRoleChange.role}? This will also sync the change to Clerk.`
            : ''
        }
        confirmLabel="Change Role"
        variant="destructive"
        onConfirm={handleRoleChangeConfirm}
        confirmButtonDisabled={updating !== null}
      />

      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete User?"
        description={
          pendingDelete
            ? `Are you sure you want to delete ${pendingDelete.displayName}? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteUserConfirm}
      />
    </div>
  );
}
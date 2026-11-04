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
  UserPlus,
} from 'lucide-react';
import { formatDate } from '@/lib/formatDate';
import { toast } from 'sonner';
import type { Role } from '@/generated/prisma/client';
import ConfirmModal from '@/components/ui/confirm-modal';
import { AcademicSelector, AcademicProfile } from '@/components/ui/academic-selector';

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
  facultyId: string | null;
  programmeId: string | null;
  branchId: string | null;
  year: number | null;
  period: string | null;
  onboarded: boolean;
  institution?: { id: string; name: string; shortName: string } | null;
  programme?: { id: string; name: string; code: string } | null;
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
  adminRole?: Role;
  showInviteButton?: boolean;
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

/** Role hierarchy from lowest to highest privilege (mirrors lib/auth.ts) */
const ROLE_HIERARCHY: Role[] = ['STUDENT', 'TUTOR', 'LECTURER', 'ADMIN', 'SUPER_ADMIN'];

/** Returns true if the admin can promote/demote this user (target role is strictly lower) */
function canModifyUser(adminRole: Role | undefined, targetRole: Role): boolean {
  if (!adminRole || adminRole === 'SUPER_ADMIN') return true;
  const adminIndex = ROLE_HIERARCHY.indexOf(adminRole);
  const targetIndex = ROLE_HIERARCHY.indexOf(targetRole);
  return adminIndex > targetIndex;
}

export default function UserManagement({ users, institutions = [], adminRole, showInviteButton }: UserManagementProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | Role>('ALL');
  const [filterInstitution, setFilterInstitution] = useState('ALL');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ role: '' });
  const [academicProfile, setAcademicProfile] = useState<AcademicProfile | null>(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: string; role: Role; displayName: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ userId: string; displayName: string } | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('STUDENT');
  const [invitePending, setInvitePending] = useState(false);

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

  const handleInviteUser = async () => {
    if (!inviteEmail || !inviteRole) return;
    setInvitePending(true);
    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (res.ok) {
        toast.success('Invitation sent successfully');
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteRole('STUDENT');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Invite error:', error);
      toast.error('An error occurred');
    } finally {
      setInvitePending(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({ role: user.role });
    setAcademicProfile({
      institutionId: user.institutionId,
      facultyId: user.facultyId,
      programmeId: user.programmeId,
      branchId: user.branchId,
      year: user.year,
      period: user.period,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser || !academicProfile) return;
    setUpdating(editingUser.clerkId);
    try {
      const body: any = { role: editForm.role };
      body.institutionId = academicProfile.institutionId;
      body.facultyId = academicProfile.facultyId;
      body.programmeId = academicProfile.programmeId;
      body.branchId = academicProfile.branchId;
      body.year = academicProfile.year;
      body.period = academicProfile.period;

      const res = await fetch(`/api/users/${editingUser.clerkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success('User updated successfully');
        setEditingUser(null);
        setAcademicProfile(null);
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
      {/* Header with Invite Button */}
      {showInviteButton && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Invite User
          </button>
        </div>
      )}
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

      {/* Mobile Card Layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {filteredUsers.map((user) => {
          const displayName = getDisplayName(user);
          const secondaryName = getSecondaryName(user);

          return (
            <div key={user.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
              {/* Header: Avatar + Name + Role */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {user.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.imageUrl}
                      alt={displayName}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium text-slate-500">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {user.username ? (
                        <span className="inline-flex items-center gap-1">
                          <AtSign className="w-3 h-3 text-slate-500" />
                          {user.username}
                        </span>
                      ) : (
                        displayName
                      )}
                    </p>
                    {secondaryName && (
                      <p className="text-xs text-slate-500 truncate">{secondaryName}</p>
                    )}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                  user.role === 'ADMIN'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                }`}>
                  {user.role}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{user.institution?.shortName || user.institution?.name || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>{formatDate(user.createdAt)}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 text-xs">
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
              </div>

              {/* Actions */}
              {canModifyUser(adminRole, user.role) && (
                <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="flex-1 flex items-center justify-center gap-1 text-xs px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg transition"
                    aria-label={`Edit ${displayName}`}
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                  {user.role === 'ADMIN' ? (
                    <button
                      onClick={() => handleRoleChangeClick(user, 'STUDENT')}
                      disabled={updating === user.clerkId}
                      className="flex-1 flex items-center justify-center gap-1 text-xs px-3 py-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg transition disabled:opacity-50"
                    >
                      <UserX className="w-3 h-3" />
                      Demote
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRoleChangeClick(user, 'ADMIN')}
                      disabled={updating === user.clerkId}
                      className="flex-1 flex items-center justify-center gap-1 text-xs px-3 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg transition disabled:opacity-50"
                    >
                      <Award className="w-3 h-3" />
                      Promote
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteUserClick(user)}
                    className="flex items-center justify-center px-3 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Institution</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredUsers.map((user) => {
                const displayName = getDisplayName(user);
                const secondaryName = getSecondaryName(user);

                return (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
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
                          <div className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium text-slate-500">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                            {user.username ? (
                              <span className="inline-flex items-center gap-1">
                                <AtSign className="w-3 h-3 text-slate-500" />
                                {user.username}
                              </span>
                            ) : (
                              displayName
                            )}
                          </p>
                          {secondaryName && (
                            <p className="text-xs text-slate-500 truncate">
                              {secondaryName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span className="text-slate-500 truncate">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span className="text-slate-500 truncate">
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
                      <div className="flex items-center gap-3 text-xs text-slate-500">
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
                      <div className="flex items-center gap-2 text-slate-500 text-xs">
                        <Calendar className="w-4 h-4" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {canModifyUser(adminRole, user.role) ? (
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
                              onClick={() => handleRoleChangeClick(user, adminRole === 'ADMIN' ? 'LECTURER' : 'ADMIN')}
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
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-xs italic">Restricted</span>
                      )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setEditingUser(null); setAcademicProfile(null); }}>
          <div className="bg-card rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Edit User</h2>
              <button
                onClick={() => { setEditingUser(null); setAcademicProfile(null); }}
                className="p-2 hover:bg-muted rounded-lg transition"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                  User
                </label>
                <p className="text-sm text-foreground">
                  {editingUser.name || editingUser.email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-input text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {adminRole === 'SUPER_ADMIN' && (
                    <>
                      <option value="STUDENT">Student</option>
                      <option value="ADMIN">Admin</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="LECTURER">Lecturer</option>
                      <option value="TUTOR">Tutor</option>
                    </>
                  )}
                  {adminRole === 'ADMIN' && (
                    <>
                      <option value="STUDENT">Student</option>
                      <option value="LECTURER">Lecturer</option>
                      <option value="TUTOR">Tutor</option>
                    </>
                  )}
                </select>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-foreground mb-3">Academic Profile</h3>
                <AcademicSelector
                  initialInstitutionId={editingUser.institutionId}
                  initialFacultyId={editingUser.facultyId}
                  initialProgrammeId={editingUser.programmeId}
                  initialBranchId={editingUser.branchId}
                  initialYear={editingUser.year}
                  initialPeriod={editingUser.period}
                  onChange={setAcademicProfile}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setEditingUser(null); setAcademicProfile(null); }}
                className="flex-1 px-4 py-2 text-sm font-medium bg-muted text-gray-700 dark:text-foreground rounded-lg hover:bg-gray-200 dark:hover:bg-muted transition"
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

      {/* Invite User Modal */}
      {showInviteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="bg-card rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Invite User</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-input text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-input text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {adminRole === 'SUPER_ADMIN' && (
                    <>
                      <option value="STUDENT">Student</option>
                      <option value="TUTOR">Tutor</option>
                      <option value="LECTURER">Lecturer</option>
                      <option value="ADMIN">Admin</option>
                    </>
                  )}
                  {adminRole === 'ADMIN' && (
                    <>
                      <option value="STUDENT">Student</option>
                      <option value="TUTOR">Tutor</option>
                      <option value="LECTURER">Lecturer</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium bg-muted text-gray-700 dark:text-foreground rounded-lg hover:bg-gray-200 dark:hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteUser}
                disabled={invitePending || !inviteEmail || !inviteRole}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                {invitePending ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
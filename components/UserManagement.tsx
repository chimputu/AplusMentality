'use client';
import { useState } from 'react';

interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'STUDENT';
  createdAt: string;
}

interface UserManagementProps {
  users: User[];
}

export default function UserManagement({ users: initialUsers }: UserManagementProps) {
  const [users, setUsers] = useState(initialUsers);
  const [loading, setLoading] = useState<string | null>(null);

  const handleRoleChange = async (clerkId: string, newRole: 'ADMIN' | 'STUDENT') => {
    if (!confirm(`Change this user's role to ${newRole}?`)) return;

    setLoading(clerkId);
    try {
      const res = await fetch('/api/admin/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId, role: newRole }),
      });

      if (res.ok) {
        setUsers(users.map(user =>
          user.clerkId === clerkId
            ? { ...user, role: newRole }
            : user
        ));
        alert('Role updated successfully!');
      } else {
        alert('Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('An error occurred');
    } finally {
      setLoading(null);
    }
  };

  if (users.length === 0) {
    return <p className="text-gray-500 text-center py-8">No users yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Role</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
              <td className="py-3 px-4">{user.name || 'Unknown'}</td>
              <td className="py-3 px-4 text-gray-600">{user.email}</td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.role === 'ADMIN'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {user.role}
                </span>
              </td>
              <td className="py-3 px-4">
                {user.role === 'STUDENT' ? (
                  <button
                    onClick={() => handleRoleChange(user.clerkId, 'ADMIN')}
                    disabled={loading === user.clerkId}
                    className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 transition"
                  >
                    {loading === user.clerkId ? '...' : 'Make Admin'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleRoleChange(user.clerkId, 'STUDENT')}
                    disabled={loading === user.clerkId}
                    className="text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50 transition"
                  >
                    {loading === user.clerkId ? '...' : 'Make Student'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
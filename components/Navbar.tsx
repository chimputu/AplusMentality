'use client';
import { useUser, SignOutButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function Navbar() {
  const { user, isLoaded } = useUser();
  const role = (user?.publicMetadata?.role as string) || 'STUDENT';

  if (!isLoaded) return null;

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold">
            A+Mentality
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  href={role === 'ADMIN' ? '/admin' : '/student'}
                  className="hover:text-gray-300 transition"
                >
                  Dashboard
                </Link>
                <span className="text-sm text-gray-400">({role})</span>
                <SignOutButton>
                  <button className="bg-red-600 hover:bg-red-700 px-4 py-1 rounded transition">
                    Sign Out
                  </button>
                </SignOutButton>
              </>
            ) : (
              <>
                <Link href="/sign-in" className="hover:text-gray-300 transition">
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
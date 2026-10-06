'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function AddInstitutionButton() {
  return (
    <Link
      href="/admin/institutions/new"
      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition text-sm font-medium whitespace-nowrap"
    >
      <Plus className="w-4 h-4" />
      Add Institution
    </Link>
  );
}

'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';

interface SearchWrapperProps {
  children: React.ReactNode;
  role: 'ADMIN' | 'STUDENT';
}

export default function SearchWrapper({ children, role }: SearchWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get('search') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // Update search query when URL changes
  useEffect(() => {
    const newSearch = searchParams?.get('search') || '';
    setSearchQuery(newSearch);
  }, [searchParams]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    
    // Update URL with search query
    if (query) {
      router.push(`${pathname}?search=${encodeURIComponent(query)}`);
    } else {
      router.push(pathname);
    }
  };

  return (
    <DashboardLayout 
      role={role} 
      searchQuery={searchQuery}
      onSearchChange={handleSearchChange}
    >
      {children}
    </DashboardLayout>
  );
}
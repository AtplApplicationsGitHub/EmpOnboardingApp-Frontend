'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth/AuthContext';
import Navbar from '../components/Navbar';
import { useSidebar } from '../components/SidebarContext';
const EmployeeLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'employee')) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'employee') {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Navbar />
      <div
        className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-56'
          }`}
      >
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;

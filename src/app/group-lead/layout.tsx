'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth/AuthContext';
import Navbar from '../components/Navbar';

const GroupLeadLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated or not a group lead
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'group_lead')) {
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

  // Don't render anything if not authenticated or not a group lead
  if (!user || user.role !== 'group_lead') {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Navbar />
      <div className="flex-1 ml-48">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default GroupLeadLayout;

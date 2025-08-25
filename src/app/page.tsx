'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth/AuthContext';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Redirect based on user role
        let redirectPath: string;
        
        switch (user.role) {
          case 'admin':
            redirectPath = '/admin';
            break;
          case 'group_lead':
            redirectPath = '/group-lead';
            break;
          case 'employee':
            redirectPath = '/employee';
            break;
          default:
            redirectPath = '/auth/login';
            break;
        }
        
        router.push(redirectPath);
      } else {
        // Redirect to login if not authenticated
        router.push('/auth/login');
      }
    }
  }, [user, isLoading, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return null; // This will redirect, so we don't need to show anything
}

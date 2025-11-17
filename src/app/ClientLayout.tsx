'use client';

import { AuthProvider } from './auth/AuthContext';
import { SidebarProvider } from './components/SidebarContext'; 

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </AuthProvider>
  );
}
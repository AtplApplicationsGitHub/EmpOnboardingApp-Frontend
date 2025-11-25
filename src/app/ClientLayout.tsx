'use client';

import { AuthProvider } from './auth/AuthContext';
import { SidebarProvider } from './components/SidebarContext';
import { ThemeProvider } from './contexts/ThemeContext';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
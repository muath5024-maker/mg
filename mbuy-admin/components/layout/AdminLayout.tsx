'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { MobileNav, BottomNav } from './MobileNav';
import { useAdminStore } from '@/store/adminStore';
import { cn } from '@/lib/utils';
import { getAuthToken } from '@/lib/worker-api';

interface AdminLayoutProps {
  children: ReactNode;
}

// Routes that don't need authentication
const publicRoutes = ['/login', '/'];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { sidebarCollapsed } = useAdminStore();
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    // Skip auth check for public routes
    if (isPublicRoute) {
      setIsChecking(false);
      return;
    }

    // Check for auth token
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
    } else {
      setIsChecking(false);
    }
  }, [pathname, isPublicRoute, router]);

  // Show loading while checking auth for protected routes
  if (!isPublicRoute && isChecking) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // For public routes (login, home), render without admin layout
  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#0B1220]">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        {/* Page Content */}
        <main
          className={cn(
            'flex-1 p-4 lg:p-6 pb-20 lg:pb-6',
            'overflow-x-hidden'
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

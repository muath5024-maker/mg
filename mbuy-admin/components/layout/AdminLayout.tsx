'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { MobileNav, BottomNav } from './MobileNav';
import { useAdminStore } from '@/store/adminStore';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { sidebarCollapsed } = useAdminStore();

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

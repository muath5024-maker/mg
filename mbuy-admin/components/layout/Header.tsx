'use client';

import { useState } from 'react';
import { Search, Bell, Menu, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminStore } from '@/store/adminStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function Header() {
  const { mobileMenuOpen, toggleMobileMenu, globalSearch, setGlobalSearch } = useAdminStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Mobile menu button */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <span className="text-sm font-bold text-white">M</span>
          </div>
          <span className="text-lg font-bold text-white">MBUY</span>
        </div>

        {/* Search - Desktop */}
        <div className="hidden lg:flex flex-1 max-w-md">
          <Input
            placeholder="بحث..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
            className="bg-zinc-800/50"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="hidden sm:flex"
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full" />
          </Button>

          {/* User avatar */}
          <div className="hidden sm:flex items-center gap-3 mr-2 pr-4 border-r border-zinc-700">
            <div className="text-left">
              <p className="text-sm font-medium text-white">المالك</p>
              <p className="text-xs text-zinc-400">admin@mbuy.app</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">م</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="lg:hidden px-4 pb-3">
        <Input
          placeholder="بحث..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          className="bg-zinc-800/50"
        />
      </div>
    </header>
  );
}

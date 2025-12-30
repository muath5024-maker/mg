'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  Users,
  CreditCard,
  Zap,
  Server,
  Megaphone,
  BarChart3,
  Settings,
  X,
  Ticket,
  Timer,
  Share2,
  Package,
  Gift,
  Coins,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminStore } from '@/store/adminStore';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'الرئيسية' },
  { href: '/stores', icon: Store, label: 'المتاجر' },
  { href: '/users', icon: Users, label: 'المستخدمين' },
  {
    href: '/pricing',
    icon: CreditCard,
    label: 'التسعير',
    children: [
      { href: '/pricing/plans', icon: Package, label: 'الباقات' },
      { href: '/pricing/credits', icon: Coins, label: 'الرصيد' },
      { href: '/pricing/rewards', icon: Gift, label: 'المكافآت' },
    ],
  },
  { href: '/features', icon: Zap, label: 'المميزات' },
  { href: '/worker', icon: Server, label: 'Worker' },
  {
    href: '/marketing',
    icon: Megaphone,
    label: 'التسويق',
    children: [
      { href: '/marketing/coupons', icon: Ticket, label: 'الكوبونات' },
      { href: '/marketing/flash-sales', icon: Timer, label: 'العروض السريعة' },
      { href: '/marketing/referrals', icon: Share2, label: 'الإحالات' },
    ],
  },
  { href: '/analytics', icon: BarChart3, label: 'التحليلات' },
  { href: '/settings', icon: Settings, label: 'الإعدادات' },
];

// Bottom nav for quick access on mobile
const bottomNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'الرئيسية' },
  { href: '/stores', icon: Store, label: 'المتاجر' },
  { href: '/users', icon: Users, label: 'المستخدمين' },
  { href: '/analytics', icon: BarChart3, label: 'التحليلات' },
  { href: '/settings', icon: Settings, label: 'الإعدادات' },
];

export function MobileNav() {
  const pathname = usePathname();
  const { mobileMenuOpen, setMobileMenuOpen } = useAdminStore();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    return pathname.startsWith(href);
  };

  if (!mobileMenuOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-72 bg-zinc-900 border-l border-zinc-800 lg:hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <span className="text-lg font-bold text-white">M</span>
            </div>
            <span className="text-lg font-bold text-white">MBUY Admin</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <MobileNavLink
                  item={item}
                  isActive={isActive(item.href)}
                  onClose={() => setMobileMenuOpen(false)}
                />
                {/* Children */}
                {item.children && isActive(item.href) && (
                  <ul className="mt-1 mr-4 space-y-1">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <MobileNavLink
                          item={child}
                          isActive={pathname === child.href}
                          onClose={() => setMobileMenuOpen(false)}
                          isChild
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}

interface MobileNavLinkProps {
  item: NavItem;
  isActive: boolean;
  onClose: () => void;
  isChild?: boolean;
}

function MobileNavLink({ item, isActive, onClose, isChild }: MobileNavLinkProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
        isActive
          ? 'bg-blue-600/20 text-blue-400'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-white',
        isChild && 'py-2'
      )}
    >
      <Icon className={cn('flex-shrink-0', isChild ? 'h-4 w-4' : 'h-5 w-5')} />
      <span className={cn('font-medium', isChild && 'text-sm')}>{item.label}</span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800 lg:hidden">
      <div className="flex items-center justify-around h-16">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 transition-colors',
                active ? 'text-blue-400' : 'text-zinc-400'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

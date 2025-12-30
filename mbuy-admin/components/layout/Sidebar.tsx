'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  Users,
  Coins,
  Wrench,
  Brain,
  Percent,
  Shield,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  // Market Management
  LayoutGrid,
  Monitor,
  Tag,
  FileText,
  // Merchant Management
  CheckCircle,
  FileCheck,
  Power,
  Star,
  BarChart3,
  // Points Management
  PlusCircle,
  MinusCircle,
  ArrowLeftRight,
  Eye,
  Receipt,
  // Tools Management
  Plus,
  DollarSign,
  Activity,
  RefreshCw,
  // AI Management
  Palette,
  FolderOpen,
  Layers,
  Calculator,
  // Commissions
  Building2,
  CreditCard,
  Crown,
  Hammer,
  // Quality & Policies
  Package,
  MessageSquare,
  AlertTriangle,
  Ban,
  // Campaigns
  Rocket,
  Heart,
  Sparkles,
  TrendingUp,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminStore } from '@/store/adminStore';
import { useState } from 'react';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'الرئيسية' },
  
  // 1) إدارة السوق
  {
    href: '/market',
    icon: Store,
    label: 'إدارة السوق',
    children: [
      { href: '/market/categories', icon: LayoutGrid, label: 'التحكم في الأقسام' },
      { href: '/market/interface', icon: Monitor, label: 'التحكم في الواجهة' },
      { href: '/market/offers', icon: Tag, label: 'التحكم في العروض' },
      { href: '/market/content', icon: FileText, label: 'التحكم في المحتوى' },
    ],
  },
  
  // 2) إدارة التجار
  {
    href: '/merchants',
    icon: Users,
    label: 'إدارة التجار',
    children: [
      { href: '/merchants/approvals', icon: CheckCircle, label: 'الموافقات' },
      { href: '/merchants/verification', icon: FileCheck, label: 'التحقق من السجل التجاري' },
      { href: '/merchants/status', icon: Power, label: 'إيقاف/تفعيل' },
      { href: '/merchants/quality', icon: Star, label: 'تقييم الجودة' },
      { href: '/merchants/reports', icon: BarChart3, label: 'تقارير الأداء' },
    ],
  },
  
  // 3) إدارة النقاط
  {
    href: '/points',
    icon: Coins,
    label: 'إدارة النقاط',
    children: [
      { href: '/points/issue', icon: PlusCircle, label: 'إصدار النقاط' },
      { href: '/points/deduct', icon: MinusCircle, label: 'خصم النقاط' },
      { href: '/points/transfer', icon: ArrowLeftRight, label: 'تحويل النقاط' },
      { href: '/points/monitoring', icon: Eye, label: 'مراقبة الاستهلاك' },
      { href: '/points/financial', icon: Receipt, label: 'تقارير مالية' },
    ],
  },
  
  // 4) إدارة الأدوات
  {
    href: '/tools',
    icon: Wrench,
    label: 'إدارة الأدوات',
    children: [
      { href: '/tools/add', icon: Plus, label: 'إضافة أدوات جديدة' },
      { href: '/tools/pricing', icon: DollarSign, label: 'تسعير الأدوات' },
      { href: '/tools/usage', icon: Activity, label: 'مراقبة الاستخدام' },
      { href: '/tools/updates', icon: RefreshCw, label: 'تحديثات الأدوات' },
    ],
  },
  
  // 5) إدارة الذكاء الاصطناعي
  {
    href: '/ai',
    icon: Brain,
    label: 'إدارة الذكاء الاصطناعي',
    children: [
      { href: '/ai/studio', icon: Palette, label: 'إدارة الاستديو' },
      { href: '/ai/projects', icon: FolderOpen, label: 'إدارة المشاريع الضخمة' },
      { href: '/ai/templates', icon: Layers, label: 'إدارة القوالب' },
      { href: '/ai/costs', icon: Calculator, label: 'إدارة التكلفة' },
    ],
  },
  
  // 6) إدارة العمولات
  {
    href: '/commissions',
    icon: Percent,
    label: 'إدارة العمولات',
    children: [
      { href: '/commissions/platform', icon: Building2, label: 'نسبة المنصة' },
      { href: '/commissions/services', icon: CreditCard, label: 'رسوم الخدمات' },
      { href: '/commissions/subscriptions', icon: Crown, label: 'رسوم الاشتراك' },
      { href: '/commissions/tools', icon: Hammer, label: 'رسوم الأدوات' },
    ],
  },
  
  // 7) إدارة الجودة والسياسات
  {
    href: '/quality',
    icon: Shield,
    label: 'إدارة الجودة والسياسات',
    children: [
      { href: '/quality/products', icon: Package, label: 'مراقبة المنتجات' },
      { href: '/quality/conversations', icon: MessageSquare, label: 'مراقبة المحادثات' },
      { href: '/quality/complaints', icon: AlertTriangle, label: 'مراقبة الشكاوى' },
      { href: '/quality/violations', icon: Ban, label: 'نظام مخالفات' },
    ],
  },
  
  // 8) إدارة الحملات
  {
    href: '/campaigns',
    icon: Megaphone,
    label: 'إدارة الحملات',
    children: [
      { href: '/campaigns/marketing', icon: Rocket, label: 'حملات تسويقية' },
      { href: '/campaigns/merchant-support', icon: Heart, label: 'حملات دعم التجار' },
      { href: '/campaigns/points', icon: Sparkles, label: 'حملات نقاط' },
      { href: '/campaigns/visibility', icon: TrendingUp, label: 'حملات ظهور' },
    ],
  },
  
  { href: '/settings', icon: Settings, label: 'الإعدادات' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAdminStore();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    return pathname.startsWith(href);
  };

  const toggleExpand = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  const isExpanded = (href: string) => expandedItems.includes(href) || isActive(href);

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col bg-zinc-900/80 border-l border-zinc-800 transition-all duration-300',
        sidebarCollapsed ? 'w-20' : 'w-72'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
            <span className="text-lg font-bold text-white">M</span>
          </div>
          {!sidebarCollapsed && (
            <span className="text-lg font-bold text-white">MBUY Admin</span>
          )}
        </Link>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              {item.children ? (
                <>
                  <button
                    onClick={() => toggleExpand(item.href)}
                    className={cn(
                      'flex items-center justify-between w-full gap-3 px-3 py-2.5 rounded-lg transition-all',
                      isActive(item.href)
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <span className="text-sm font-medium">{item.label}</span>
                      )}
                    </div>
                    {!sidebarCollapsed && (
                      <ChevronDown 
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isExpanded(item.href) && "rotate-180"
                        )} 
                      />
                    )}
                  </button>
                  {/* Children */}
                  {!sidebarCollapsed && isExpanded(item.href) && (
                    <ul className="mt-1 mr-3 space-y-1 border-r border-zinc-800 pr-3">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm',
                              pathname === child.href
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
                            )}
                          >
                            <child.icon className="h-4 w-4 flex-shrink-0" />
                            <span>{child.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                    isActive(item.href)
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800">
        {!sidebarCollapsed && (
          <p className="text-xs text-zinc-500 text-center">MBUY Admin v2.0</p>
        )}
      </div>
    </aside>
  );
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminState {
  // Sidebar state
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;

  // Search
  globalSearch: string;

  // Notifications
  notifications: Notification[];

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setGlobalSearch: (search: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: number;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarCollapsed: false,
      mobileMenuOpen: false,
      globalSearch: '',
      notifications: [],

      // Actions
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      toggleMobileMenu: () =>
        set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

      setMobileMenuOpen: (open) =>
        set({ mobileMenuOpen: open }),

      setGlobalSearch: (search) =>
        set({ globalSearch: search }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: Math.random().toString(36).substring(2, 9),
              timestamp: Date.now(),
            },
            ...state.notifications,
          ].slice(0, 10), // Keep only last 10 notifications
        })),

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearNotifications: () =>
        set({ notifications: [] }),
    }),
    {
      name: 'admin-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

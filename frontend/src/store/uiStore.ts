import { create } from 'zustand';
import type { Notification } from '../types';

interface UIState {
  activePage: 'dashboard' | 'transactions' | 'analytics' | 'goals' | 'settings';
  sidebarOpen: boolean;
  activeModal: string | null;
  notifications: Notification[];
  isOnboarded: boolean;
  setActivePage: (page: UIState['activePage']) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (id: string) => void;
  setIsOnboarded: (isOnboarded: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activePage: 'dashboard',
  sidebarOpen: true,
  activeModal: null,
  notifications: [],
  isOnboarded: false,

  setActivePage: (page) => set({ activePage: page }),
  
  setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  openModal: (modalId) => set({ activeModal: modalId }),
  
  closeModal: () => set({ activeModal: null }),
  
  setNotifications: (notifications) => set({ notifications }),
  
  addNotification: (notification) => set((state) => ({ 
    notifications: [notification, ...state.notifications] 
  })),
  
  markNotificationAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => 
      n.id === id ? { ...n, read: true } : n
    )
  })),
  
  setIsOnboarded: (isOnboarded) => set({ isOnboarded }),
}));

import { create } from 'zustand';
import type { UserProfile, FinancialHealth } from '../types';

interface UserState {
  profile: UserProfile | null;
  health: FinancialHealth | null;
  setProfile: (p: UserProfile) => void;
  setHealth: (h: FinancialHealth) => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: {
    monthlyIncome: 75000,
    currentSavings: 5000000,
    name: "Alex"
  },
  health: null,
  setProfile: (profile) => set({ profile }),
  setHealth: (health) => set({ health }),
}));

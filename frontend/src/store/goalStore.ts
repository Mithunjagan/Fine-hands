import { create } from 'zustand';
import type { Goal } from '../types';
import { fetchGoals, createGoal as apiCreateGoal, updateGoal as apiUpdateGoal } from '../lib/api';

interface GoalState {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
  
  loadGoals: () => Promise<void>;
  addGoal: (goalData: { title: string; target: number; deadline: string; icon?: string; color?: string }) => Promise<void>;
  updateGoalProgress: (id: string, current: number) => Promise<void>;
  rescheduleGoal: (id: string, deadline: string) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set) => ({
  goals: [],
  isLoading: false,
  error: null,

  loadGoals: async () => {
    set({ isLoading: true, error: null });
    try {
      const { goals } = await fetchGoals();
      set({ goals, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  addGoal: async (goalData) => {
    set({ isLoading: true, error: null });
    try {
      const { goal } = await apiCreateGoal(goalData);
      set((state) => ({ 
        goals: [...state.goals, goal],
        isLoading: false 
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  updateGoalProgress: async (id, current) => {
    set({ isLoading: true, error: null });
    try {
      const { goal } = await apiUpdateGoal(id, { current });
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? goal : g)),
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  rescheduleGoal: async (id, deadline) => {
    set({ isLoading: true, error: null });
    try {
      const { goal } = await apiUpdateGoal(id, { deadline });
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? goal : g)),
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  }
}));

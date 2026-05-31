import { create } from 'zustand';
import type { GamificationState, Quest } from '../types';

interface GamificationStore extends GamificationState {
  addXp: (amount: number) => void;
  updateQuestProgress: (questId: string, progressAmount: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
}

const DEFAULT_QUESTS: Quest[] = [
  { id: 'q1', title: 'First Steps', description: 'Log your first 5 transactions', xp: 50, progress: 0, target: 5, completed: false, icon: '🚀' },
  { id: 'q2', title: 'Saver', description: 'Set 3 financial goals', xp: 100, progress: 0, target: 3, completed: false, icon: '🎯' },
  { id: 'q3', title: 'Budget Master', description: 'Stay under budget for a week', xp: 150, progress: 0, target: 1, completed: false, icon: '👑' }
];

export const useGamificationStore = create<GamificationStore>((set, get) => ({
  xp: 0,
  level: 1,
  nextLevelXp: 100,
  quests: DEFAULT_QUESTS,
  badges: [],
  streak: 0,

  addXp: (amount) => {
    set((state) => {
      let newXp = state.xp + amount;
      let newLevel = state.level;
      let newNextLevelXp = state.nextLevelXp;

      while (newXp >= newNextLevelXp) {
        newLevel++;
        newNextLevelXp = Math.floor(newNextLevelXp * 1.5);
      }

      return { xp: newXp, level: newLevel, nextLevelXp: newNextLevelXp };
    });
  },

  updateQuestProgress: (questId, progressAmount) => {
    set((state) => {
      const quests = state.quests.map((q) => {
        if (q.id === questId && !q.completed) {
          const newProgress = Math.min(q.progress + progressAmount, q.target);
          const completed = newProgress >= q.target;
          if (completed) {
            setTimeout(() => get().addXp(q.xp), 0); // Award XP when completed
          }
          return { ...q, progress: newProgress, completed };
        }
        return q;
      });
      return { quests };
    });
  },

  incrementStreak: () => set((state) => ({ streak: state.streak + 1 })),
  
  resetStreak: () => set({ streak: 0 })
}));

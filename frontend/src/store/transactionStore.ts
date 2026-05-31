import { create } from 'zustand';
import type { Transaction } from '../types';

interface TransactionState {
  transactions: Transaction[];
  setTransactions: (t: Transaction[]) => void;
  addTransaction: (t: Transaction) => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (transaction) => set((state) => ({ 
    transactions: [transaction, ...state.transactions] 
  })),
}));

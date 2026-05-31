/**
 * Finehands API Client
 * ====================
 * Centralized API layer with error handling, retry logic, and typed methods.
 */

import type {
  FinancialHealth,
  Anomaly,
  Persona,
  MonteCarloResult,
  Goal,
  Notification,
  HeatmapDay,
  NetWorthData,
  ReceiptResult,
  Transaction,
} from '../types';

const API_BASE = 'http://127.0.0.1:5005';

// --------------- Generic Helpers ---------------

async function fetchJSON<T>(
  url: string,
  options: RequestInit = {},
  retries = 2
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${API_BASE}${url}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      // Exponential backoff: 500ms, 1500ms
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }

  throw new Error('Max retries exceeded');
}

// --------------- Health Check ---------------

export async function checkHealth(): Promise<boolean> {
  try {
    await fetchJSON<{ status: string }>('/api/health', {}, 0);
    return true;
  } catch {
    return false;
  }
}

// --------------- Analytics ---------------

export async function fetchHealthScore(
  transactions: Transaction[],
  currentSavings: number,
  monthlyIncome: number
): Promise<FinancialHealth> {
  return fetchJSON<FinancialHealth>('/api/analytics/health-score', {
    method: 'POST',
    body: JSON.stringify({
      transactions,
      current_savings: currentSavings,
      monthly_income: monthlyIncome,
    }),
  });
}

export async function fetchAnomalies(
  transactions: Transaction[],
  threshold = 2.0
): Promise<{ anomalies: Anomaly[]; total: number }> {
  return fetchJSON('/api/analytics/anomalies', {
    method: 'POST',
    body: JSON.stringify({ transactions, threshold }),
  });
}

export async function fetchPersona(
  transactions: Transaction[],
  monthlyIncome: number
): Promise<Persona> {
  return fetchJSON<Persona>('/api/analytics/persona', {
    method: 'POST',
    body: JSON.stringify({ transactions, monthly_income: monthlyIncome }),
  });
}

export async function fetchSimulation(params: {
  currentSavings: number;
  monthlySavingsRate: number;
  expense?: number;
  months?: number;
  goalTarget?: number;
}): Promise<MonteCarloResult> {
  return fetchJSON<MonteCarloResult>('/api/analytics/simulate', {
    method: 'POST',
    body: JSON.stringify({
      current_savings: params.currentSavings,
      monthly_savings_rate: params.monthlySavingsRate,
      expense: params.expense || 0,
      months: params.months || 6,
      goal_target: params.goalTarget || 0,
    }),
  });
}

export async function fetchHeatmapData(
  transactions: Transaction[]
): Promise<{ days: HeatmapDay[] }> {
  return fetchJSON('/api/analytics/heatmap-data', {
    method: 'POST',
    body: JSON.stringify({ transactions }),
  });
}

export async function fetchNetWorth(params: {
  currentSavings: number;
  investments?: number;
  liabilities?: number;
  transactions: Transaction[];
  monthlyIncome: number;
}): Promise<NetWorthData> {
  return fetchJSON<NetWorthData>('/api/analytics/net-worth', {
    method: 'POST',
    body: JSON.stringify({
      current_savings: params.currentSavings,
      investments: params.investments || 0,
      liabilities: params.liabilities || 0,
      transactions: params.transactions,
      monthly_income: params.monthlyIncome,
    }),
  });
}

// --------------- AI ---------------

export function streamAdvice(
  transactions: Transaction[],
  healthScore: number,
  unusedSubs: number,
  savingsRate: number,
  query: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (error: string) => void
): AbortController {
  const controller = new AbortController();

  fetch(`${API_BASE}/api/ai/advice/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transactions: transactions.slice(0, 50),
      health_score: healthScore,
      unused_subs: unusedSubs,
      savings_rate: savingsRate,
      query,
    }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.body) throw new Error('No stream');
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.replace('data: ', '');
            if (data === '[DONE]') break;
            onToken(data.replace(/\\n/g, '\n').replace(/\\"/g, '"'));
          }
        }
      }
      onDone();
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError(err.message || 'Stream failed');
      }
    });

  return controller;
}

// --------------- Goals ---------------

export async function fetchGoals(): Promise<{ goals: Goal[] }> {
  return fetchJSON('/api/goals/');
}

export async function createGoal(goal: {
  title: string;
  target: number;
  deadline: string;
  icon?: string;
  color?: string;
}): Promise<{ status: string; goal: Goal }> {
  return fetchJSON('/api/goals/', {
    method: 'POST',
    body: JSON.stringify(goal),
  });
}

export async function updateGoal(
  goalId: string,
  updates: Partial<Goal>
): Promise<{ status: string; goal: Goal }> {
  return fetchJSON(`/api/goals/${goalId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// --------------- Transactions ---------------

export async function processReceipt(imageBase64: string): Promise<ReceiptResult> {
  return fetchJSON<ReceiptResult>('/api/transactions/ocr-receipt', {
    method: 'POST',
    body: JSON.stringify({ image: imageBase64 }),
  });
}

export async function addTransaction(transaction: {
  amount: number;
  category: string;
  vendor: string;
  date: string;
}): Promise<{ status: string; transaction: Transaction }> {
  return fetchJSON('/api/transactions/add', {
    method: 'POST',
    body: JSON.stringify(transaction),
  });
}

export async function uploadStatement(file: File): Promise<{ filename: string; transactions: Transaction[]; error?: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/transactions/upload-statement`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}


// --------------- Notifications ---------------

export async function fetchNotifications(params: {
  transactions: Transaction[];
  goals: Goal[];
  healthData: FinancialHealth | null;
  currentSavings: number;
  monthlyIncome: number;
}): Promise<{ notifications: Notification[]; unread_count: number; has_critical: boolean }> {
  return fetchJSON('/api/notifications/', {
    method: 'POST',
    body: JSON.stringify({
      transactions: params.transactions,
      goals: params.goals,
      health_data: params.healthData || {},
      current_savings: params.currentSavings,
      monthly_income: params.monthlyIncome,
    }),
  });
}

// --------------- Onboarding ---------------

export async function onboardUser(profile: {
  name: string;
  monthly_income: number;
  current_savings: number;
  city: string;
  spending_style: string;
}): Promise<{
  status: string;
  profile: Record<string, unknown>;
  initial_assessment: Record<string, unknown>;
}> {
  return fetchJSON('/api/onboard/', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

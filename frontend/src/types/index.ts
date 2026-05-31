// ============================================
// Finehands TypeScript Schema Definitions
// All API response types and internal state types
// ============================================

// --- Transaction ---
export interface Transaction {
  id: string;
  amount: number;
  category: string;
  vendor: string;
  date: string;
  status?: 'active' | 'unused' | 'flagged';
  isSubscription?: boolean;
}

// --- Financial Health Score ---
export interface HealthFactor {
  value: number;
  weight: number;
  label: string;
  description: string;
}

export interface FinancialHealth {
  score: number;
  grade: string;
  trend: 'improving' | 'declining' | 'stable';
  factors: Record<string, HealthFactor>;
  metrics: {
    savings_rate: number;
    bloat_index: number;
    months_covered: number;
  };
}

// --- Anomaly ---
export interface Anomaly {
  transaction: Transaction;
  z_score: number;
  sigma: number;
  severity: 'warning' | 'alert' | 'critical';
  is_spike: boolean;
  category: string;
  category_mean: number;
  category_median: number;
  explanation: string;
}

// --- Persona ---
export interface Persona {
  persona: string;
  description: string;
  icon: string;
  color: string;
  confidence: number;
  traits: string[];
  radar_data: RadarDataPoint[];
  advice: string;
  feature_vector: Record<string, number>;
}

export interface RadarDataPoint {
  subject: string;
  A: number;
  fullMark: number;
}

// --- Monte Carlo ---
export interface MonteCarloBand {
  month: string;
  monthFull: string;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface MonteCarloResult {
  bands: MonteCarloBand[];
  goal_probability: number;
  summary: {
    starting_balance: number;
    expected_final: number;
    best_case: number;
    worst_case: number;
    expected_growth: number;
    monthly_avg_growth: number;
    simulations: number;
    months: number;
  };
}

// --- Goals ---
export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  deadline: string;
  icon: string;
  color: string;
  created_at: string;
  progress: number;
  days_remaining: number;
  remaining_amount: number;
  required_monthly: number;
  status: 'on_track' | 'behind' | 'completed' | 'overdue';
  is_feasible?: boolean;
  suggested_months?: number;
}

// --- Notifications ---
export interface Notification {
  id: string;
  type: 'anomaly_alert' | 'subscription_warning' | 'score_change' | 'goal_milestone' | 'savings_tip';
  severity: 'critical' | 'alert' | 'warning' | 'success' | 'info';
  title: string;
  body: string;
  icon: string;
  timestamp: string;
  read: boolean;
}

// --- Heatmap ---
export interface HeatmapDay {
  date: string;
  total: number;
  count: number;
  topCategory: string;
}

// --- Net Worth ---
export interface NetWorthData {
  net_worth: number;
  breakdown: {
    savings: number;
    investments: number;
    liabilities: number;
  };
  trend: { month: string; value: number }[];
  month_over_month: {
    change: number;
    percentage: number;
    direction: 'up' | 'down' | 'flat';
  };
}

// --- Receipt OCR ---
export interface ReceiptResult {
  vendor: string;
  amount: number;
  date: string;
  category: string;
  items?: string[];
  confidence: number;
  source: 'ai_vision' | 'mock';
}

// --- User Profile ---
export interface UserProfile {
  name: string;
  monthlyIncome: number;
  currentSavings: number;
  city?: string;
  spendingStyle?: 'frugal' | 'moderate' | 'lavish';
}

// --- Gamification ---
export interface Quest {
  id: string;
  title: string;
  description: string;
  xp: number;
  progress: number;
  target: number;
  completed: boolean;
  icon: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

export interface GamificationState {
  xp: number;
  level: number;
  nextLevelXp: number;
  quests: Quest[];
  badges: Badge[];
  streak: number;
}

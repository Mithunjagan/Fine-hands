/**
 * Synthetic Transaction Data Generator
 * ======================================
 * City-aware, profile-based generation of 6 months of realistic transactions.
 * Features:
 *   - City cost-of-living multipliers
 *   - Income-proportional spending
 *   - Realistic subscription mix
 *   - Seasonal spending patterns
 *   - Guaranteed anomalies for demo
 *   - Category-aware vendor lists
 */

import type { Transaction } from '../types';

// City cost-of-living multipliers (relative to Mumbai = 1.0)
const CITY_MULTIPLIERS: Record<string, number> = {
  Mumbai: 1.0,
  Delhi: 0.9,
  Bangalore: 0.95,
  Hyderabad: 0.8,
  Chennai: 0.82,
  Pune: 0.85,
  Kolkata: 0.75,
  Ahmedabad: 0.7,
};

// Realistic vendor pools by category
const VENDORS: Record<string, string[]> = {
  dining: ['Starbucks', 'Zomato', 'Swiggy', 'Pizza Hut', 'McDonald\'s', 'Local Dhaba', 'Barbeque Nation', 'Chai Point', 'Dominos', 'Haldirams'],
  groceries: ['BigBasket', 'Zepto', 'DMart', 'Nature\'s Basket', 'Blinkit', 'Reliance Fresh', 'More Megastore'],
  entertainment: ['PVR Cinemas', 'BookMyShow', 'Steam', 'PlayStation Store', 'Spotify Premium'],
  shopping: ['Amazon', 'Flipkart', 'Myntra', 'Ajio', 'Nykaa', 'Croma', 'Apple Store'],
  transport: ['Uber', 'Ola', 'Rapido', 'Indian Oil', 'HP Petrol', 'Metro Card Top-up'],
  utilities: ['Electricity Bill', 'Jio Fiber', 'Airtel', 'Water Bill', 'Municipal Tax', 'Gas Connection'],
};

// Subscription templates
const SUBSCRIPTIONS: { vendor: string; amount: number; status: 'active' | 'unused' }[] = [
  { vendor: 'Netflix Premium', amount: 649, status: 'active' },
  { vendor: 'Spotify Family', amount: 179, status: 'active' },
  { vendor: 'Amazon Prime', amount: 149, status: 'active' },
  { vendor: 'Cult.fit Gym', amount: 1500, status: 'unused' },
  { vendor: 'Adobe Creative Cloud', amount: 1675, status: 'unused' },
  { vendor: 'YouTube Premium', amount: 149, status: 'active' },
  { vendor: 'Hotstar', amount: 299, status: 'unused' },
  { vendor: 'iCloud Storage', amount: 75, status: 'active' },
];

// Spending ranges by category (as fraction of income)
const CATEGORY_BUDGET: Record<string, { min: number; max: number; frequency: number }> = {
  dining: { min: 0.08, max: 0.20, frequency: 12 },     // 12 dining txns/month
  groceries: { min: 0.10, max: 0.18, frequency: 6 },
  entertainment: { min: 0.03, max: 0.08, frequency: 3 },
  shopping: { min: 0.05, max: 0.15, frequency: 4 },
  transport: { min: 0.05, max: 0.12, frequency: 8 },
  utilities: { min: 0.06, max: 0.10, frequency: 3 },
};

// Festival months (0-indexed) — October (Diwali), December (Christmas/NYE), March (Holi)
const FESTIVAL_MONTHS = [2, 9, 11];

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateSyntheticData(
  income: number,
  months = 6,
  city = 'Mumbai'
): Transaction[] {
  const transactions: Transaction[] = [];
  const costMult = CITY_MULTIPLIERS[city] ?? 0.85;
  const adjustedIncome = income * costMult;
  const today = new Date();

  for (let m = 0; m < months; m++) {
    const currentMonth = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const monthIdx = currentMonth.getMonth();
    const isFestival = FESTIVAL_MONTHS.includes(monthIdx);
    const festivalMultiplier = isFestival ? 1.4 : 1.0;

    // Add subscriptions (monthly recurring)
    for (let s = 0; s < SUBSCRIPTIONS.length; s++) {
      const sub = SUBSCRIPTIONS[s];
      transactions.push({
        id: `sub-${m}-${s}`,
        amount: sub.amount,
        category: 'subscription',
        vendor: sub.vendor,
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1 + s * 3).toISOString(),
        status: sub.status,
        isSubscription: true,
      });
    }

    // Generate category spending
    for (const [category, budget] of Object.entries(CATEGORY_BUDGET)) {
      const categoryBudget = adjustedIncome * randomBetween(budget.min, budget.max) * festivalMultiplier;
      const numTxns = Math.floor(budget.frequency * randomBetween(0.7, 1.3));
      const avgAmount = categoryBudget / numTxns;

      const vendorList = VENDORS[category] ?? ['Unknown'];

      for (let i = 0; i < numTxns; i++) {
        const day = Math.floor(Math.random() * 28) + 1;
        // Add randomness: some transactions are small, some big
        const amount = avgAmount * randomBetween(0.3, 2.2);

        transactions.push({
          id: `txn-${m}-${category}-${i}`,
          amount: parseFloat(amount.toFixed(2)),
          category,
          vendor: pickRandom(vendorList),
          date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString(),
        });
      }
    }
  }

  // Inject deliberate anomalies (for demo — ensures anomaly detector finds something)
  const anomalies: Transaction[] = [
    {
      id: 'anomaly-gucci',
      amount: parseFloat((income * 0.45).toFixed(2)),  // ~45% of monthly income on one item
      category: 'shopping',
      vendor: 'Gucci',
      date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'anomaly-party',
      amount: parseFloat((income * 0.12).toFixed(2)),
      category: 'dining',
      vendor: 'The Leela Palace',
      date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'anomaly-flight',
      amount: parseFloat((income * 0.25).toFixed(2)),
      category: 'transport',
      vendor: 'IndiGo Airlines',
      date: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  transactions.push(...anomalies);

  // Sort newest first
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

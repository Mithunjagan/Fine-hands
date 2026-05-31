const fs = require('fs');
const path = require('path');

const replaceInFile = (filePath, replacements) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const { from, to } of replacements) {
      content = content.replace(from, to);
    }
    fs.writeFileSync(filePath, content);
  } catch(e) {
    console.log('Skipping ' + filePath);
  }
};

// 1. App.tsx
replaceInFile('src/App.tsx', [
  { from: "import React, { useEffect } from 'react';", to: "import { useEffect } from 'react';" },
  { from: "import { generateSyntheticData } from './lib/dataGenerator';\n", to: "" }
]);

// 2. AIAdvisor.tsx
replaceInFile('src/components/AIAdvisor.tsx', [
  { from: "import React, { useState, useEffect, useRef } from 'react';", to: "import { useState, useEffect, useRef } from 'react';" },
  { from: "const { profile } = useUserStore();\n", to: "" }
]);

// 3. AnomalyScanner.tsx
replaceInFile('src/components/AnomalyScanner.tsx', [
  { from: "import { Anomaly } from '../types';", to: "import type { Anomaly } from '../types';" },
  { from: "onDismiss, onInvestigate, isScanning", to: "onDismiss, isScanning" } 
]);

// 4. ErrorBoundary.tsx
replaceInFile('src/components/ErrorBoundary.tsx', [
  { from: "import React, { Component, ErrorInfo, ReactNode } from 'react';", to: "import { Component } from 'react';\nimport type { ErrorInfo, ReactNode } from 'react';" }
]);

// 5. GamificationPanel.tsx
replaceInFile('src/components/GamificationPanel.tsx', [
  { from: "Trophy, Star, Shield, Medal, CheckCircle2", to: "Trophy, Star, Medal, CheckCircle2" }
]);

// 6. GoalTracker.tsx
replaceInFile('src/components/GoalTracker.tsx', [
  { from: "import { Goal } from '../types';", to: "import type { Goal } from '../types';" },
  { from: "const { goals, addGoal, updateGoalProgress, isLoading }", to: "const { goals, addGoal, isLoading }" }
]);

// 7. HealthScoreGauge.tsx
replaceInFile('src/components/HealthScoreGauge.tsx', [
  { from: "import React, { useEffect, useState } from 'react';", to: "import { useEffect, useState } from 'react';" },
  { from: "import { FinancialHealth } from '../types';", to: "import type { FinancialHealth } from '../types';" }
]);

// 8. MonteCarloSimulator.tsx
replaceInFile('src/components/MonteCarloSimulator.tsx', [
  { from: "import React, { useEffect, useState, useCallback } from 'react';", to: "import { useEffect, useState, useCallback } from 'react';" },
  { from: "import { LineChart, RefreshCw, Target } from 'lucide-react';", to: "import { LineChart, RefreshCw } from 'lucide-react';" },
  { from: "import { MonteCarloResult } from '../types';", to: "import type { MonteCarloResult } from '../types';" },
  { from: "(value: number, name: string) =>", to: "(value: any, name: string) =>" }
]);

// 9. NetWorthTracker.tsx
replaceInFile('src/components/NetWorthTracker.tsx', [
  { from: "import { NetWorthData } from '../types';", to: "import type { NetWorthData } from '../types';" }
]);

// 10. NotificationCenter.tsx
replaceInFile('src/components/NotificationCenter.tsx', [
  { from: "import { Notification } from '../types';", to: "import type { Notification } from '../types';" }
]);

// 11. ReceiptOCR.tsx
replaceInFile('src/components/ReceiptOCR.tsx', [
  { from: "import { ReceiptResult } from '../types';", to: "import type { ReceiptResult } from '../types';" },
  { from: "Camera, Upload, Loader2, Plus, Edit2, Check } from 'lucide-react';", to: "Camera, Upload, Loader2, Plus, Edit2, Check, X } from 'lucide-react';" }
]);

// 12. SkeletonLoader.tsx
replaceInFile('src/components/SkeletonLoader.tsx', [
  { from: "import React from 'react';\n", to: "" }
]);

// 13. SpendingDNA.tsx
replaceInFile('src/components/SpendingDNA.tsx', [
  { from: "import React, { useEffect, useState } from 'react';", to: "import { useEffect, useState } from 'react';" },
  { from: "import { Persona } from '../types';", to: "import type { Persona } from '../types';" }
]);

// 14. SpendingHeatmap.tsx
replaceInFile('src/components/SpendingHeatmap.tsx', [
  { from: "import { HeatmapDay } from '../types';", to: "import type { HeatmapDay } from '../types';" },
  { from: "grid.slice(weekIndex * 7, weekIndex * 7 + 7).map((day, i) =>", to: "grid.slice(weekIndex * 7, weekIndex * 7 + 7).map((day: any) =>" }
]);

// 15. Dashboard.tsx
replaceInFile('src/pages/Dashboard.tsx', [
  { from: "import React, { useEffect, useState, useMemo } from 'react';", to: "import { useEffect, useState } from 'react';" },
  { from: "Bell, User, Plus, Camera, MessageSquare, Compass, Activity, Zap, Target as TargetIcon, Award, Brain", to: "Bell, User, Plus, Camera, MessageSquare, Compass, Activity, Zap, Target as TargetIcon, Brain" },
  { from: "const { toggleSidebar, sidebarOpen, openModal, notifications } = useUIStore();", to: "const { sidebarOpen, openModal, notifications } = useUIStore();" }
]);

// 16. gamificationStore.ts
replaceInFile('src/store/gamificationStore.ts', [
  { from: "import { GamificationState, Quest, Badge } from '../types';", to: "import type { GamificationState, Quest, Badge } from '../types';" }
]);

// 17. goalStore.ts
replaceInFile('src/store/goalStore.ts', [
  { from: "import { Goal } from '../types';", to: "import type { Goal } from '../types';" },
  { from: "export const useGoalStore = create<GoalState>((set, get) => ({", to: "export const useGoalStore = create<GoalState>((set) => ({" }
]);

// 18. uiStore.ts
replaceInFile('src/store/uiStore.ts', [
  { from: "import { Notification } from '../types';", to: "import type { Notification } from '../types';" }
]);

console.log('Fixed TS errors');

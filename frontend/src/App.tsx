import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import { useTransactionStore } from './store/transactionStore';
import { useUserStore } from './store/userStore';
import { useUIStore } from './store/uiStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OnboardingWizard } from './components/OnboardingWizard';

function App() {
  const { setTransactions } = useTransactionStore();
  const { profile } = useUserStore();
  const { isOnboarded } = useUIStore();

  useEffect(() => {
    // Only generate synthetic data if profile exists and we have no transactions yet
    // But OnboardingWizard also generates data, so we don't strictly need this here
    // keeping it just in case someone skips onboarding
    if (profile && isOnboarded) {
      // Actually, we don't want to overwrite data continuously
    }
  }, [profile, isOnboarded, setTransactions]);

  return (
    <ErrorBoundary>
      <Router>
        {!isOnboarded && <OnboardingWizard />}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

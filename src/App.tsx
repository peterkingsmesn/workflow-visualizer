// React 17+ JSX Transform으로 인해 React import 불필요
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { useWorkflowStore } from './store/workflowStore';
import { WorkflowProvider, useWorkflowTheme } from './contexts/WorkflowStateContext';
import { KeyboardShortcutManager } from './utils/KeyboardShortcutManager';
import { FocusManager } from './utils/FocusManager';
import './i18n/config';
import './styles/global.css';
import './styles/app.css';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/UserDashboard'));
const Editor = lazy(() => import('./pages/Editor'));
const Settings = lazy(() => import('./pages/Settings'));
const Collaboration = lazy(() => import('./pages/Collaboration'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Landing = lazy(() => import('./pages/Landing'));
const OAuthCallback = lazy(() => import('./pages/auth/OAuthCallback'));
const LoginDirect = lazy(() => import('./pages/auth/LoginDirect'));
const OAuthError = lazy(() => import('./pages/auth/OAuthError'));
const OAuthSetup = lazy(() => import('./pages/auth/OAuthSetup'));
const OAuthHelper = lazy(() => import('./pages/auth/OAuthHelper'));
const Billing = lazy(() => import('./pages/billing/Billing'));
const BillingSuccess = lazy(() => import('./pages/billing/Success'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const Admin = lazy(() => import('./pages/Admin'));

const LoadingSpinner = () => (
  <div className="loading-spinner">Loading...</div>
);

// 🚀 성능 최적화: 테마 상태만 구독하는 내부 컴포넌트
const AppContent = () => {
  const { theme } = useWorkflowTheme();

  return (
    <div className={`app ${theme}`}>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/editor/:projectId" element={<Editor />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/collaboration/:roomId" element={<Collaboration />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="/auth/dev-login" element={<LoginDirect />} />
          <Route path="/auth/oauth-error" element={<OAuthError />} />
          <Route path="/auth/oauth-setup" element={<OAuthSetup />} />
          <Route path="/auth/oauth-helper" element={<OAuthHelper />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/billing/success" element={<BillingSuccess />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Suspense>
    </div>
  );
};

function App() {
  // 🚀 키보드 접근성: 글로벌 키보드 매니저 초기화
  useEffect(() => {
    // 키보드 단축키 관리자 시작
    KeyboardShortcutManager.startListening();
    
    // 개발 모드에서 디버깅 활성화
    if (process.env.NODE_ENV === 'development') {
      KeyboardShortcutManager.setDebugMode(true);
      FocusManager.setDebugMode(true);
    }
    
    return () => {
      KeyboardShortcutManager.stopListening();
      FocusManager.destroy();
    };
  }, []);

  return (
    <WorkflowProvider>
      <Router>
        <AppContent />
      </Router>
    </WorkflowProvider>
  );
}

export default App;
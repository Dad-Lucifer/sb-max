import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));
const OwnerDashboard = lazy(() => import('./pages/OwnerDashboard'));
const PricingConfigPage = lazy(() => import('./pages/PricingConfig'));
const Analytics = lazy(() => import('./pages/Analytics'));

const PageLoader = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: '#090a0f',
    color: '#00F0FF',
    fontFamily: 'Inter, system-ui, sans-serif'
  }}>
    <div style={{
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      border: '3px solid rgba(0, 240, 255, 0.15)',
      borderTopColor: '#00F0FF',
      animation: 'appSpin 0.8s linear infinite'
    }} />
    <style>{`@keyframes appSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Owner-only routes — role guard blocks URL access */}
        <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/owner/pricing" element={<DashboardLayout><PricingConfigPage /></DashboardLayout>} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/employee/*" element={<EmployeeDashboard />} />
          <Route path="/analytic" element={<Analytics />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;

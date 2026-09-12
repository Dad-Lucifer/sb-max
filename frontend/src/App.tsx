import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Analytics from './pages/Analytics';
import OwnerDashboard from './pages/OwnerDashboard';
import PricingConfigPage from './pages/PricingConfig';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Signup from './pages/Signup';

// const BlockedSignup = () => (
//   <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000', color: '#fff', fontFamily: 'Manrope, sans-serif', gap: '20px' }}>
//     <span style={{ fontSize: '1.5rem' }}>Ye konse gali mai aagaye aap sir ?</span>
//     <a href="/login" style={{ color: '#00F0FF', textDecoration: 'underline', fontSize: '1rem' }}>Go back to Signin</a>
//   </div>
// );

function App() {
  return (
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
  );
}

export default App;

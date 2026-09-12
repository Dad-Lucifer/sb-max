
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: string[] }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>Loading...</div>;
    }

    if (!user) return <Navigate to="/login" replace />;

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to={user.role === 'owner' ? '/owner' : '/employee'} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;

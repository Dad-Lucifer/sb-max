import DashboardLayout from '../layouts/DashboardLayout';
import QuickActions from '../components/dashboard/QuickActions';
import ActiveBattles from '../components/dashboard/ActiveBattles';
import ActiveSessions from '../components/dashboard/ActiveSessions';
import UpcomingBookings from '../components/dashboard/UpcomingBookings';
import './EmployeeDashboard.css';

const EmployeeDashboard = () => {
    return (
        <DashboardLayout className="employee-dashboard-layout">
            <div className="dashboard-content-redesign">
                <QuickActions />
                <ActiveSessions />
                <UpcomingBookings />

                <ActiveBattles />


                <footer className="dashboard-footer">
                    &copy; 2024 SB Gaming Cafe Management System
                </footer>
            </div>
        </DashboardLayout>
    );
};

export default EmployeeDashboard;

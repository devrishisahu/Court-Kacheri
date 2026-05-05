import { useSelector } from 'react-redux';
import AdminDashboardPage from './AdminDashboardPage';
import LawyerDashboardPage from './LawyerDashboardPage';
import ClientDashboardPage from './ClientDashboardPage';
import SuperAdminDashboard from '../admin/SuperAdminDashboard';

export default function DashboardRouter() {
  const { user } = useSelector((state) => state.auth);

  if (user?.role === 'super_admin') {
    return <SuperAdminDashboard />;
  }

  if (user?.role === 'lawyer') {
    return <LawyerDashboardPage />;
  }

  if (user?.role === 'client') {
    return <ClientDashboardPage />;
  }
  
  return <AdminDashboardPage />;
}

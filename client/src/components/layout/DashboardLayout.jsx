import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 md:p-8 lg:p-10 pt-16 lg:pt-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

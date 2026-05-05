import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import Spinner from './components/ui/Spinner';
import RoleGate from './components/ui/RoleGate';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';

// Pages — Lazy-loaded would be nice, but for clarity we import directly
import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CasesPage from './pages/cases/CasesPage';
import CaseDetailPage from './pages/cases/CaseDetailPage';
import DocumentIntelligencePage from './pages/cases/DocumentIntelligencePage';
import ClientsPage from './pages/clients/ClientsPage';
import ClientDetailPage from './pages/clients/ClientDetailPage';
import DeadlinesPage from './pages/deadlines/DeadlinesPage';
import DocumentsPage from './pages/documents/DocumentsPage';
import TimeEntriesPage from './pages/timeentries/TimeEntriesPage';
import BillingPage from './pages/billing/BillingPage';
import InvoiceDetailPage from './pages/billing/InvoiceDetailPage';
import FirmPage from './pages/firm/FirmPage';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';
import ChatRoom from './pages/chat/ChatRoom';
import MessagesPage from './pages/chat/MessagesPage';

function ProtectedRoute() {
  const { token, loading } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function SuperAdminRoute() {
  const { user, token, loading } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!token || user?.role !== 'super_admin') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a0a] text-white font-['Inter']">
      <h1 className="text-8xl font-bold font-['Playfair_Display'] mb-4">404</h1>
      <p className="text-[#a0a0a0] text-xl mb-8">This route does not exist.</p>
      <a
        href="/"
        className="bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
      >
        Return Home
      </a>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected — wrap in DashboardLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* Admin & Lawyer Only */}
            <Route element={<RoleGate roles={['admin', 'lawyer']} />}>
              <Route path="/deadlines" element={<DeadlinesPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/time-entries" element={<TimeEntriesPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/clients/:id" element={<ClientDetailPage />} />
            </Route>

            {/* Admin Only */}
            <Route element={<RoleGate roles={['admin']} />}>
              <Route path="/firm" element={<FirmPage />} />
            </Route>

            {/* Shared with specific logic inside */}
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/cases/:id" element={<CaseDetailPage />} />
            <Route path="/cases/:id/documents/:docId/intelligence" element={<DocumentIntelligencePage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/billing/:id" element={<InvoiceDetailPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/chat/:id" element={<ChatRoom />} />
          </Route>
        </Route>

        {/* Super Admin */}
        <Route element={<SuperAdminRoute />}>
          <Route path="/super-admin" element={<SuperAdminDashboard />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#111111',
            color: '#ffffff',
            border: '1px solid #2a2a2a',
            fontFamily: 'Inter, sans-serif',
          },
        }}
      />
    </>
  );
}

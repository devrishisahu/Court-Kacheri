import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import {
  LayoutDashboard,
  Scale,
  Users,
  Calendar,
  FileText,
  Clock,
  Receipt,
  Building,
  LogOut,
  Menu,
  X,
  MessageSquare,
} from 'lucide-react';
import Badge from '../ui/Badge';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'lawyer', 'client'] },
  { label: 'Cases', path: '/cases', icon: Scale, roles: ['admin', 'lawyer', 'client'] },
  { label: 'Messages', path: '/messages', icon: MessageSquare, roles: ['admin', 'lawyer', 'client'] },
  { label: 'Clients', path: '/clients', icon: Users, roles: ['admin', 'lawyer'] },
  { label: 'Deadlines', path: '/deadlines', icon: Calendar, roles: ['admin', 'lawyer'] },
  { label: 'Documents', path: '/documents', icon: FileText, roles: ['admin', 'lawyer'] },
  { label: 'Time Entries', path: '/time-entries', icon: Clock, roles: ['admin', 'lawyer'] },
  { label: 'Billing', path: '/billing', icon: Receipt, roles: ['admin', 'client'] },
  { label: 'My Firm', path: '/firm', icon: Building, roles: ['admin'] },
];

const roleLabels = {
  admin: 'Firm Admin',
  lawyer: 'Lawyer',
  client: 'Client',
  super_admin: 'Super Admin',
};

export default function Sidebar() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="pl-6 pt-8 pb-10">
        <h1 className="text-xl text-white font-['Playfair_Display'] font-bold">
          ⚖ Court-Kacheri
        </h1>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems
          .filter((item) => item.roles.includes(user?.role))
          .map(({ label, path, icon: Icon }) => (
            <NavLink
            key={path}
            to={path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mx-3 rounded-lg text-sm font-['Inter'] font-medium transition-colors ${
                isActive
                  ? 'bg-white text-black'
                  : 'text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a]'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User Info */}
      <div className="p-4 mx-3 mb-4 rounded-xl bg-[#111111] border border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-white text-xs font-semibold font-['Inter']">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate font-['Inter']">
              {user?.name}
            </p>
            <div className="mt-1 flex">
              <Badge variant={user?.role === 'admin' ? 'white' : 'neutral'}>
                {roleLabels[user?.role] || user?.role}
              </Badge>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 mt-3 text-[#f87171] text-xs hover:text-red-300 transition-colors font-['Inter']"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#111111] border border-[#2a2a2a] text-white"
      >
        <Menu size={20} />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0a0a0a] border-r border-[#1a1a1a] h-screen fixed left-0 top-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 z-50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 w-64 bg-[#0a0a0a] border-r border-[#1a1a1a] h-screen z-50"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-[#555555] hover:text-white"
              >
                <X size={20} />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

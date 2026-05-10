import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plane, LogOut, User, ShieldCheck, Map, Compass, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/trips',     label: 'My Trips',  icon: Map },
  { to: '/cities',    label: 'Explore',   icon: Compass },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="p-1.5 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors">
              <Plane className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">Travelloop</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => {
              const active = pathname === to || pathname.startsWith(to + '/');
              return (
                <Link
                  key={to} to={to}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150
                    ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
            {user?.is_admin && (
              <Link to="/admin"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${pathname === '/admin' ? 'bg-indigo-50 text-indigo-600' : 'text-indigo-600 hover:bg-indigo-50'}`}
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link to="/profile"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700 group-hover:text-gray-900">
                {user?.name?.split(' ')[0]}
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;

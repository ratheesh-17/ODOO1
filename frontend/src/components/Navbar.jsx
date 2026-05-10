import { Link, useNavigate } from 'react-router-dom';
import { Plane, LogOut, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <Plane className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Travelloop</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-600">
            <Link to="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
            <Link to="/trips" className="hover:text-blue-600 transition-colors">My Trips</Link>
            <Link to="/cities" className="hover:text-blue-600 transition-colors">Explore</Link>
            {user?.is_admin && (
              <Link to="/admin" className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold transition-colors">
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>
          <div className="flex items-center space-x-3">
            <Link to="/profile" className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <span className="hidden sm:block">{user?.name}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

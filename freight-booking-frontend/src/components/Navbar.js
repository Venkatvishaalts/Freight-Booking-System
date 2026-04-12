import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutSuccess } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';

export default function Navbar() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutSuccess());
    toast.info('Logged out successfully');
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.user_type === 'shipper') return '/shipper/dashboard';
    if (user.user_type === 'carrier') return '/carrier/dashboard';
    if (user.user_type === 'admin') return '/admin/dashboard';
    return '/';
  };

  return (
    <nav className="bg-blue-700 text-white px-6 py-3 flex justify-between items-center shadow-md">
      {/* Logo */}
      <Link to="/" className="text-xl font-bold tracking-wide">
        🚛 FreightBook
      </Link>

      {/* Right side */}
      <div className="flex gap-4 items-center">
        {isAuthenticated ? (
          <>
            <Link
              to={getDashboardLink()}
              className="text-sm hover:text-blue-200 transition"
            >
              Dashboard
            </Link>
            <Link
              to="/profile"
              className="text-sm hover:text-blue-200 transition"
            >
              {user?.username}
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm hover:text-blue-200 transition">
              Login
            </Link>
            <Link
              to="/register"
              className="bg-white text-blue-700 hover:bg-blue-50 px-4 py-1 rounded text-sm font-medium transition"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
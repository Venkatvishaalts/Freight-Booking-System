import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginUser } from '../services/authService';
import { loginSuccess } from '../redux/slices/authSlice';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const res = await loginUser(form);
    console.log('Login response:', res.data); // ← shows full response in Console

    // Handle both response shapes safely
    const userData = res.data.data || res.data.user || res.data;
    const token = res.data.token;

    if (!userData || !token) {
      toast.error('Unexpected response from server');
      return;
    }

    dispatch(loginSuccess({ user: userData, token }));
    toast.success(`Welcome back, ${userData.username}!`);

    const role = userData.user_type;
    if (role === 'shipper') navigate('/shipper/dashboard');
    else if (role === 'carrier') navigate('/carrier/dashboard');
    else if (role === 'admin') navigate('/admin/dashboard');
    else navigate('/');

  } catch (err) {
    console.error('Login error:', err.response?.data);
    toast.error(err.response?.data?.message || 'Login failed. Check credentials.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white shadow rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" name="email" data-cy="email" value={form.email}
              onChange={handleChange} required placeholder="john@example.com"
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" data-cy="password" name="password" value={form.password}
              onChange={handleChange} required placeholder="Your password"
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            data-cy="submit"         
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium transition"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ShipperDashboard from './pages/ShipperDashboard';
import CarrierDashboard from './pages/CarrierDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ShipmentDetails from './pages/ShipmentDetails';
import TrackingPage from './pages/TrackingPage';
import ProfilePage from './pages/ProfilePage';

// PrivateRoute: blocks access if not logged in
// If role is specified, also blocks wrong user types
const PrivateRoute = ({ children, role }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.user_type !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/shipments/:id" element={<ShipmentDetails />} />
        <Route path="/track/:shipmentId" element={<TrackingPage />} />

        {/* Protected Routes */}
        <Route
          path="/shipper/dashboard"
          element={
            <PrivateRoute role="shipper">
              <ShipperDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/carrier/dashboard"
          element={
            <PrivateRoute role="carrier">
              <CarrierDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute role="admin">
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />

        {/* Catch-all: redirect unknown URLs to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
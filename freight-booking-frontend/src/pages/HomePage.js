import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const features = [
  { icon: '📦', title: 'Post Shipments', desc: 'Shippers post freight requirements in minutes.' },
  { icon: '🚛', title: 'Find Carriers', desc: 'Verified carriers browse and accept shipments.' },
  { icon: '📍', title: 'Live Tracking', desc: 'Track your freight from pickup to delivery.' },
  { icon: '⭐', title: 'Ratings & Reviews', desc: 'Build trust through verified reviews.' },
];

const steps = [
  { step: '1', title: 'Register', desc: 'Create a shipper or carrier account in seconds.' },
  { step: '2', title: 'Post or Browse', desc: 'Shippers post freight. Carriers browse available jobs.' },
  { step: '3', title: 'Track & Deliver', desc: 'Track shipments live and confirm delivery.' },
];

export default function HomePage() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const getDashboard = () => {
    if (user?.user_type === 'shipper') return '/shipper/dashboard';
    if (user?.user_type === 'carrier') return '/carrier/dashboard';
    return '/admin/dashboard';
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-blue-700 text-white text-center py-24 px-6">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
          Ship Smarter.<br />Track in Real-Time.
        </h1>
        <p className="text-lg text-blue-100 mb-8 max-w-xl mx-auto">
          Connect shippers with trusted carriers. Manage logistics from booking to delivery.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          {isAuthenticated ? (
            <Link to={getDashboard()}
              className="bg-white text-blue-700 px-8 py-3 rounded font-semibold hover:bg-blue-50 transition">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/register"
                className="bg-white text-blue-700 px-8 py-3 rounded font-semibold hover:bg-blue-50 transition">
                Get Started Free
              </Link>
              <Link to="/login"
                className="border border-white text-white px-8 py-3 rounded font-semibold hover:bg-blue-600 transition">
                Login
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">Why FreightBook?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="text-center p-6 bg-gray-50 rounded-lg hover:shadow-md transition">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-blue-700 text-white text-center py-16 px-6">
        <h2 className="text-3xl font-bold mb-4">Ready to streamline your logistics?</h2>
        <Link to="/register"
          className="bg-white text-blue-700 px-8 py-3 rounded font-semibold hover:bg-blue-50 transition inline-block">
          Create Free Account
        </Link>
      </div>
    </div>
  );
}
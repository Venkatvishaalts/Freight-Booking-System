import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, shipments: 0, bookings: 0 });
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shipRes] = await Promise.all([
          api.get('/shipments'),
        ]);
        setShipments(shipRes.data);
        setStats((prev) => ({ ...prev, shipments: shipRes.data.length }));
      } catch {
        toast.error('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Shipments', value: stats.shipments, color: 'bg-blue-100 text-blue-700' },
    { label: 'Total Users', value: stats.users, color: 'bg-green-100 text-green-700' },
    { label: 'Total Bookings', value: stats.bookings, color: 'bg-purple-100 text-purple-700' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {statCards.map((card) => (
            <div key={card.label} className={`rounded-lg p-6 ${card.color}`}>
              <p className="text-sm font-medium opacity-80">{card.label}</p>
              <p className="text-3xl font-bold mt-1">{card.value}</p>
            </div>
          ))}
        </div>

        {/* All Shipments Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-700">All Shipments</h2>
          </div>

          {loading ? (
            <p className="p-6 text-gray-400">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="p-3 text-left">ID</th>
                    <th className="p-3 text-left">Route</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Weight</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((s) => (
                    <tr key={s.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">#{s.id}</td>
                      <td className="p-3">{s.pickup_location} → {s.delivery_location}</td>
                      <td className="p-3">{s.freight_type}</td>
                      <td className="p-3">{s.weight} kg</td>
                      <td className="p-3">
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                          {s.current_status}
                        </span>
                      </td>
                      <td className="p-3 text-gray-400">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
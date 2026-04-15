import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { createShipment, getShipperShipments, deleteShipment } from '../services/shipmentService';
import ShipmentCard from '../components/ShipmentCard';

const emptyForm = {
  pickup_location: '',
  delivery_location: '',
  freight_type: '',
  weight: '',
  quantity: '',
  scheduled_pickup_date: '',
  scheduled_delivery_date: '',
  price_quote: '',
};

export default function ShipperDashboard() {
  const { user } = useSelector((state) => state.auth);
  const [shipments, setShipments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchMyShipments = useCallback(async () => {
    setFetching(true);
    try {
      const res = await getShipperShipments(user.id);
      console.log('Shipments response:', res.data);

      const data = Array.isArray(res.data) ? res.data
                 : Array.isArray(res.data.data) ? res.data.data
                 : [];
      setShipments(data);
    } catch {
      toast.error('Failed to load shipments');
      setShipments([]);
    } finally {
      setFetching(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.id) {
      fetchMyShipments();
    }
  }, [fetchMyShipments, user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createShipment({ ...form, shipper_id: user.id });
      toast.success('Shipment posted successfully!');
      setForm(emptyForm);
      setShowForm(false);
      fetchMyShipments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error posting shipment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (shipmentId) => {
    if (!window.confirm('Cancel this shipment?')) return;
    try {
      await deleteShipment(shipmentId);
      toast.success('Shipment cancelled');
      fetchMyShipments();
    } catch {
      toast.error('Could not cancel shipment');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Shipper Dashboard</h1>
            <p className="text-gray-500 text-sm">Welcome, {user?.username}</p>
          </div>
          <button
            data-cy="new-shipment"
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-medium transition"
          >
            {showForm ? '✕ Cancel' : '+ Post Shipment'}
          </button>
        </div>

        {/* Post Shipment Form */}
        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">New Shipment Request</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                <input
                  data-cy="pickup"
                  type="text"
                  name="pickup_location"
                  value={form.pickup_location}
                  onChange={handleChange}
                  required
                  placeholder="Chennai, Tamil Nadu"
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Location</label>
                <input
                  data-cy="delivery"
                  type="text"
                  name="delivery_location"
                  value={form.delivery_location}
                  onChange={handleChange}
                  required
                  placeholder="Mumbai, Maharashtra"
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Freight Type</label>
                <select
                  data-cy="freight-type"
                  name="freight_type"
                  value={form.freight_type}
                  onChange={handleChange}
                  required
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select type</option>
                  <option value="electronics">Electronics</option>
                  <option value="food">Food & Perishables</option>
                  <option value="machinery">Machinery</option>
                  <option value="furniture">Furniture</option>
                  <option value="clothing">Clothing</option>
                  <option value="chemicals">Chemicals</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input
                  data-cy="weight"
                  type="number"
                  name="weight"
                  value={form.weight}
                  onChange={handleChange}
                  required
                  placeholder="500"
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  data-cy="quantity"
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                  placeholder="10"
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Quote (₹)</label>
                <input
                  data-cy="price-quote"
                  type="number"
                  name="price_quote"
                  value={form.price_quote}
                  onChange={handleChange}
                  placeholder="15000"
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
                <input
                  data-cy="pickup-date"
                  type="date"
                  name="scheduled_pickup_date"
                  value={form.scheduled_pickup_date}
                  onChange={handleChange}
                  required
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</label>
                <input
                  data-cy="delivery-date"
                  type="date"
                  name="scheduled_delivery_date"
                  value={form.scheduled_delivery_date}
                  onChange={handleChange}
                  required
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  data-cy="submit-shipment"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-medium transition"
                >
                  {loading ? 'Submitting...' : 'Submit Shipment Request'}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* My Shipments List */}
        <h2 className="text-xl font-semibold text-gray-700 mb-4">My Shipments</h2>

        {fetching ? (
          <p className="text-gray-400">Loading shipments...</p>
        ) : shipments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-400 text-lg">No shipments posted yet.</p>
            <p className="text-gray-400 text-sm mt-1">Click "+ Post Shipment" to get started.</p>
          </div>
        ) : (
          shipments.map((s) => (
            <ShipmentCard
              key={s.id}
              shipment={s}
              showDelete={s.current_status === 'pending'}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
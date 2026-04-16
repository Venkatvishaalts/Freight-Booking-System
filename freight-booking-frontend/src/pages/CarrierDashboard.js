import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { getAllShipments } from '../services/shipmentService';
import { createBooking, getCarrierBookings } from '../services/bookingService';
import { addTrackingUpdate } from '../services/trackingService';

export default function CarrierDashboard() {
  const { user } = useSelector((state) => state.auth);
  const [availableShipments, setAvailableShipments] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const [fetching, setFetching] = useState(true);
  const [trackingModal, setTrackingModal] = useState(null);
  const [trackingForm, setTrackingForm] = useState({ status: '', location: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchAvailable = async () => {
    setFetching(true);
    try {
      const res = await getAllShipments({ status: 'pending' });
      console.log('Available shipments response:', res.data);
      const data = Array.isArray(res.data) ? res.data
                 : Array.isArray(res.data.data) ? res.data.data
                 : [];
      setAvailableShipments(data);
    } catch {
      toast.error('Failed to load available shipments');
      setAvailableShipments([]);
    } finally {
      setFetching(false);
    }
  };

  const fetchMyBookings = async () => {
    setFetching(true);
    try {
      const res = await getCarrierBookings(user.id);
      console.log('My bookings response:', res.data);
      const data = Array.isArray(res.data) ? res.data
                 : Array.isArray(res.data.data) ? res.data.data
                 : [];
      setMyBookings(data);
    } catch {
      toast.error('Failed to load your bookings');
      setMyBookings([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      if (activeTab === 'available') fetchAvailable();
      else fetchMyBookings();
    }
  }, [activeTab]);

  const handleAccept = async (shipmentId) => {
    try {
      await createBooking({ shipment_id: shipmentId, carrier_id: user.id });
      toast.success('Booking accepted!');
      fetchAvailable();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not accept booking');
    }
  };

  const handleTrackingSubmit = async () => {
    if (!trackingForm.status || !trackingForm.location) {
      toast.error('Status and location are required');
      return;
    }
    setSubmitting(true);
    try {
      await addTrackingUpdate({
        shipment_id: trackingModal,
        status: trackingForm.status,
        location: trackingForm.location,
        notes: trackingForm.notes
      });
      toast.success('Tracking updated successfully!');
      setTrackingModal(null);
      setTrackingForm({ status: '', location: '', notes: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update tracking');
    } finally {
      setSubmitting(false);
    }
  };

  const bookingStatusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Carrier Dashboard</h1>
          <p className="text-gray-500 text-sm">
            Welcome, {user?.username}
            {user?.company_name && ` — ${user.company_name}`}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            data-cy="tab-available-shipments"
            onClick={() => setActiveTab('available')}
            className={`pb-2 px-1 font-medium text-sm border-b-2 transition ${
              activeTab === 'available'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Available Shipments
          </button>
          <button
            data-cy="tab-my-bookings"
            onClick={() => setActiveTab('mybookings')}
            className={`pb-2 px-1 font-medium text-sm border-b-2 transition ${
              activeTab === 'mybookings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Bookings
          </button>
        </div>

        {/* Available Shipments Tab */}
        {activeTab === 'available' && (
          <>
            {fetching ? (
              <p className="text-gray-400">Loading available shipments...</p>
            ) : availableShipments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-4xl mb-3">🚛</p>
                <p className="text-gray-400 text-lg">No available shipments right now.</p>
                <p className="text-gray-400 text-sm mt-1">Check back soon for new bookings.</p>
              </div>
            ) : (
              availableShipments.map((s) => (
                <div
                  key={s.id}
                  data-cy="shipment-card"
                  className="bg-white shadow rounded-lg p-4 mb-4 border border-gray-100 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {s.pickup_location} → {s.delivery_location}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">Weight: {s.weight} kg</p>
                      {s.quantity && (
                        <p className="text-sm text-gray-500">Quantity: {s.quantity}</p>
                      )}
                      {s.amount && (
                        <p className="text-sm text-gray-500">Amount: ₹{s.amount}</p>
                      )}
                      {s.freight_type && (
                        <p className="text-sm text-gray-500">Freight Type: {s.freight_type}</p>
                      )}
                      {s.pickup_date && (
                        <p className="text-sm text-gray-500">
                          Pickup: {new Date(s.pickup_date).toLocaleDateString()}
                        </p>
                      )}
                      {s.delivery_date && (
                        <p className="text-sm text-gray-500">
                          Delivery: {new Date(s.delivery_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700">
                      pending
                    </span>
                  </div>
                  <button
                    data-cy="accept-booking"
                    onClick={() => handleAccept(s.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition"
                  >
                    Accept Booking
                  </button>
                </div>
              ))
            )}
          </>
        )}

        {/* My Bookings Tab */}
        {activeTab === 'mybookings' && (
          <>
            {fetching ? (
              <p className="text-gray-400">Loading your bookings...</p>
            ) : myBookings.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-gray-400 text-lg">No bookings accepted yet.</p>
                <p className="text-gray-400 text-sm mt-1">
                  Go to Available Shipments to accept your first booking.
                </p>
              </div>
            ) : (
              myBookings.map((b) => (
                <div
                  key={b.id}
                  data-cy={`booking-card-${b.id}`}
                  className="bg-white shadow rounded-lg p-4 mb-4 border border-gray-100"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800">Booking #{b.id}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Shipment ID: {b.shipment_id}
                      </p>
                      <p className="text-sm text-gray-500">
                        Accepted:{' '}
                        {b.accepted_at
                          ? new Date(b.accepted_at).toLocaleDateString()
                          : 'N/A'}
                      </p>
                      {b.estimated_delivery && (
                        <p className="text-sm text-gray-500">
                          Est. Delivery:{' '}
                          {new Date(b.estimated_delivery).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      bookingStatusColors[b.booking_status] || 'bg-gray-100 text-gray-600'
                    }`}>
                      {b.booking_status}
                    </span>
                  </div>

                  {/* Update Tracking Button */}
                  <div className="mt-3">
                    <button
                      onClick={() => setTrackingModal(b.shipment_id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition"
                    >
                      📍 Update Tracking
                    </button>
                  </div>

                </div>
              ))
            )}
          </>
        )}

        {/* Tracking Update Modal */}
        {trackingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-bold text-gray-800 mb-4">📍 Update Tracking Status</h2>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-600 mb-1">Status *</label>
                <select
                  value={trackingForm.status}
                  onChange={(e) => setTrackingForm({ ...trackingForm, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Status --</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="in_transit">In Transit</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-600 mb-1">Current Location *</label>
                <input
                  type="text"
                  placeholder="e.g. Delhi Warehouse"
                  value={trackingForm.location}
                  onChange={(e) => setTrackingForm({ ...trackingForm, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">Notes (optional)</label>
                <textarea
                  placeholder="Any additional info..."
                  value={trackingForm.notes}
                  onChange={(e) => setTrackingForm({ ...trackingForm, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleTrackingSubmit}
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Update'}
                </button>
                <button
                  onClick={() => {
                    setTrackingModal(null);
                    setTrackingForm({ status: '', location: '', notes: '' });
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition"
                >
                  Cancel
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
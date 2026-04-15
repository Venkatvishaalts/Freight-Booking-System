import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { getAllShipments } from '../services/shipmentService';
import { createBooking, getCarrierBookings } from '../services/bookingService';

export default function CarrierDashboard() {
  const { user } = useSelector((state) => state.auth);
  const [availableShipments, setAvailableShipments] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const [fetching, setFetching] = useState(true);

  const fetchAvailable = useCallback(async () => {
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
  }, []);

  const fetchMyBookings = useCallback(async () => {
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
  }, [user]);

  // ✅ Fix: all four deps included — activeTab, fetchAvailable, fetchMyBookings, user
  useEffect(() => {
    if (user && user.id) {
      if (activeTab === 'available') fetchAvailable();
      else fetchMyBookings();
    }
  }, [activeTab, fetchAvailable, fetchMyBookings, user]);

  const handleAccept = async (shipmentId) => {
    try {
      await createBooking({ shipment_id: shipmentId, carrier_id: user.id });
      toast.success('Booking accepted!');
      fetchAvailable();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not accept booking');
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
                      <p className="text-sm text-gray-500 mt-1">
                        Weight: {s.weight} kg
                      </p>
                      {s.quantity && (
                        <p className="text-sm text-gray-500">
                          Quantity: {s.quantity}
                        </p>
                      )}
                      {s.amount && (
                        <p className="text-sm text-gray-500">
                          Amount: ₹{s.amount}
                        </p>
                      )}
                      {s.freight_type && (
                        <p className="text-sm text-gray-500">
                          Freight Type: {s.freight_type}
                        </p>
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
                </div>
              ))
            )}
          </>
        )}

      </div>
    </div>
  );
}
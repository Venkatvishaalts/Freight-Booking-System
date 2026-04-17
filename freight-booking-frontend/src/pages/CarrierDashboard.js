import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { getAllShipments } from '../services/shipmentService';
import { createBooking, getCarrierBookings, acceptBooking } from '../services/bookingService'; // ✅ UPDATED
import { addTrackingUpdate } from '../services/trackingService';

export default function CarrierDashboard() {
  const { user } = useSelector((state) => state.auth);

  const [availableShipments, setAvailableShipments] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const [fetching, setFetching] = useState(true);

  const [trackingModal, setTrackingModal] = useState(null);
  const [trackingForm, setTrackingForm] = useState({
    status: '',
    location: '',
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);

  // ================= FETCH DATA =================
  const fetchAvailable = async () => {
    setFetching(true);
    try {
      const res = await getAllShipments({ status: 'pending' });

      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.data)
        ? res.data.data
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

      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.data)
        ? res.data.data
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
  }, [activeTab, user]);

  // ================= ✅ FIXED ACCEPT BOOKING =================
  const handleAccept = async (shipmentId) => {
    try {
      const res = await createBooking({
        shipment_id: shipmentId,
        carrier_id: user.id
      });

      const bookingId = res.data.data.id;

      // 🔥 Accept booking immediately
      await acceptBooking(bookingId);

      toast.success('Booking accepted!');
      fetchAvailable();
      fetchMyBookings();

    } catch (err) {
      toast.error(err.response?.data?.message || 'Error accepting booking');
    }
  };

  // ================= TRACKING =================
  const handleTrackingSubmit = async () => {
    if (!trackingForm.status) {
      toast.error('Status is required');
      return;
    }

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    setSubmitting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          await addTrackingUpdate({
            shipment_id: trackingModal,
            status: trackingForm.status,
            location: trackingForm.location || "Auto-detected location",
            notes: trackingForm.notes,
            latitude,
            longitude
          });

          toast.success('Tracking updated successfully!');
          setTrackingModal(null);
          setTrackingForm({ status: '', location: '', notes: '' });

        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to update tracking');
        } finally {
          setSubmitting(false);
        }
      },
      () => {
        toast.error("Please allow location access");
        setSubmitting(false);
      }
    );
  };

  // ================= UI =================
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-2xl font-bold mb-4">Carrier Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button onClick={() => setActiveTab('available')}>
            Available Shipments
          </button>
          <button onClick={() => setActiveTab('mybookings')}>
            My Bookings
          </button>
        </div>

        {/* ================= AVAILABLE ================= */}
        {activeTab === 'available' &&
          availableShipments.map((s) => (
            <div key={s.id} className="bg-white p-4 mb-4 rounded shadow">
              <h2>{s.pickup_location} → {s.delivery_location}</h2>
              <p>Weight: {s.weight} kg</p>

              <button
                onClick={() => handleAccept(s.id)}
                className="bg-blue-600 text-white px-4 py-2 mt-2 rounded"
              >
                Accept Shipment
              </button>
            </div>
          ))}

        {/* ================= BOOKINGS ================= */}
        {activeTab === 'mybookings' &&
          myBookings.map((b) => (
            <div key={b.id} className="bg-white p-4 mb-4 rounded shadow">

              <p>Shipment ID: {b.shipment_id}</p>

              {/* ✅ SHOW STATUS */}
              <p>Status: {b.booking_status}</p>

              {/* ✅ SHOW BUTTON ONLY IF ACCEPTED */}
              {b.booking_status === 'accepted' && (
                <button
                  onClick={() => setTrackingModal(b.shipment_id)}
                  className="bg-green-600 text-white px-4 py-2 mt-2 rounded"
                >
                  📍 Update Tracking
                </button>
              )}

            </div>
          ))}

        {/* ================= MODAL ================= */}
        {trackingModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded w-96">
              <select
                value={trackingForm.status}
                onChange={(e) =>
                  setTrackingForm({ ...trackingForm, status: e.target.value })
                }
              >
                <option value="">Select Status</option>
                <option value="picked_up">Picked Up</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
              </select>

              <button onClick={handleTrackingSubmit}>
                Submit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
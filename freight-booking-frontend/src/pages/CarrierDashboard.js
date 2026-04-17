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
  }, [activeTab]);

  // ================= ACCEPT BOOKING =================
  const handleAccept = async (shipmentId) => {
    try {
      await createBooking({
        shipment_id: shipmentId,
        carrier_id: user.id
      });
      toast.success('Booking accepted!');
      fetchAvailable();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not accept booking');
    }
  };

  // ================= 🚀 UPDATED TRACKING WITH GPS =================
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

          console.log("📍 LIVE LOCATION:", latitude, longitude);

          await addTrackingUpdate({
            shipment_id: trackingModal,
            status: trackingForm.status,
            location: trackingForm.location || "Auto-detected location",
            notes: trackingForm.notes,
            latitude,   // ✅ NEW
            longitude   // ✅ NEW
          });

          toast.success('Tracking updated successfully!');

          setTrackingModal(null);
          setTrackingForm({
            status: '',
            location: '',
            notes: ''
          });

        } catch (err) {
          toast.error(
            err.response?.data?.message || 'Failed to update tracking'
          );
        } finally {
          setSubmitting(false);
        }
      },
      (error) => {
        console.error("Location error:", error);
        toast.error("Please allow location access");
        setSubmitting(false);
      }
    );
  };

  // ================= UI =================
  const bookingStatusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Carrier Dashboard
          </h1>
          <p className="text-gray-500 text-sm">
            Welcome, {user?.username}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('available')}
            className={`pb-2 ${
              activeTab === 'available'
                ? 'border-blue-600 text-blue-600'
                : 'text-gray-500'
            }`}
          >
            Available Shipments
          </button>

          <button
            onClick={() => setActiveTab('mybookings')}
            className={`pb-2 ${
              activeTab === 'mybookings'
                ? 'border-blue-600 text-blue-600'
                : 'text-gray-500'
            }`}
          >
            My Bookings
          </button>
        </div>

        {/* BOOKINGS */}
        {activeTab === 'mybookings' &&
          myBookings.map((b) => (
            <div key={b.id} className="bg-white p-4 mb-4 rounded shadow">
              <p>Shipment ID: {b.shipment_id}</p>

              <button
                onClick={() => setTrackingModal(b.shipment_id)}
                className="bg-green-600 text-white px-4 py-2 mt-2 rounded"
              >
                📍 Update Tracking
              </button>
            </div>
          ))}

        {/* MODAL */}
        {trackingModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded w-96">

              <h2 className="text-lg font-bold mb-4">
                Update Tracking
              </h2>

              <select
                value={trackingForm.status}
                onChange={(e) =>
                  setTrackingForm({
                    ...trackingForm,
                    status: e.target.value
                  })
                }
                className="w-full mb-3 border p-2"
              >
                <option value="">Select Status</option>
                <option value="picked_up">Picked Up</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
              </select>

              <input
                placeholder="Location (optional)"
                value={trackingForm.location}
                onChange={(e) =>
                  setTrackingForm({
                    ...trackingForm,
                    location: e.target.value
                  })
                }
                className="w-full mb-3 border p-2"
              />

              <textarea
                placeholder="Notes"
                value={trackingForm.notes}
                onChange={(e) =>
                  setTrackingForm({
                    ...trackingForm,
                    notes: e.target.value
                  })
                }
                className="w-full mb-3 border p-2"
              />

              <button
                onClick={handleTrackingSubmit}
                className="bg-blue-600 text-white px-4 py-2 w-full"
              >
                Submit
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
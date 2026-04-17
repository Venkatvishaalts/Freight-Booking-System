import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

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

  const socketRef = useRef(null);

  // ================= SOCKET SETUP =================
  useEffect(() => {
    if (!user) return;

    const SOCKET_URL =
      process.env.REACT_APP_API_URL ||
      'https://freight-booking-system.onrender.com';

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Dashboard socket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Socket error:', err.message);
    });

    // 🔥 Join all shipment rooms
    myBookings.forEach((b) => {
      socket.emit('joinShipment', b.shipment_id);
    });

    // 🔥 Listen for live updates
    socket.on('trackingUpdated', (data) => {
      console.log('🔥 Dashboard update:', data);

      // Update UI instantly
      setMyBookings((prev) =>
        prev.map((b) =>
          b.shipment_id === data.shipment_id
            ? { ...b, live_status: data.status }
            : b
        )
      );

      toast.info('📍 Shipment updated!');
    });

    return () => {
      socket.disconnect();
    };
  }, [myBookings]);

  // ================= FETCH =================
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

  // ================= ACCEPT =================
  const handleAccept = async (shipmentId) => {
    try {
      await createBooking({
        shipment_id: shipmentId,
        carrier_id: user.id
      });
      toast.success('Booking accepted!');
      fetchAvailable();
    } catch {
      toast.error('Could not accept booking');
    }
  };

  // ================= TRACKING =================
  const handleTrackingSubmit = async () => {
    if (!trackingForm.status) {
      toast.error('Status is required');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await addTrackingUpdate({
            shipment_id: trackingModal,
            status: trackingForm.status,
            location: trackingForm.location || "Auto-detected",
            notes: trackingForm.notes,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });

          toast.success('Tracking updated!');
          setTrackingModal(null);
          fetchMyBookings(); // refresh
        } catch {
          toast.error('Failed to update tracking');
        }
      },
      () => toast.error('Enable location')
    );
  };

  // ================= UI =================
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Carrier Dashboard</h1>

      {/* BOOKINGS */}
      {activeTab === 'mybookings' &&
        myBookings.map((b) => (
          <div key={b.id} className="bg-white p-4 mt-4 shadow rounded">

            <p>Shipment ID: {b.shipment_id}</p>

            {/* 🔥 LIVE STATUS */}
            <p className="text-sm mt-1">
              Status:
              <span className="ml-2 font-bold text-blue-600">
                {b.live_status || b.status || 'pending'}
              </span>
            </p>

            <button
              onClick={() => setTrackingModal(b.shipment_id)}
              className="bg-green-600 text-white px-3 py-1 mt-2 rounded"
            >
              📍 Update Tracking
            </button>
          </div>
        ))}

      {/* MODAL */}
      {trackingModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-5 rounded w-80">

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

            <button
              onClick={handleTrackingSubmit}
              className="bg-blue-600 text-white w-full py-2"
            >
              Submit
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
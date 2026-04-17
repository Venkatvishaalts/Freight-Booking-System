import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'react-toastify';
import { getTrackingByShipment } from '../services/trackingService';
import { io } from 'socket.io-client';

// ── Fix Leaflet icon ──
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Status UI
const statusLabels = {
  picked_up: '📦 Picked Up',
  in_transit: '🚛 In Transit',
  out_for_delivery: '🏍️ Out for Delivery',
  delivered: '✅ Delivered',
};

function MapUpdater({ lat, lng }) {
  const map = useMap();

  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 10, { animate: true });
    }
  }, [lat, lng, map]);

  return null;
}

export default function TrackingPage() {
  const { shipmentId } = useParams();

  const [trackingData, setTrackingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const intervalRef = useRef(null);
  const socketRef = useRef(null);

  // ── FETCH TRACKING ──
  const fetchTracking = async () => {
    try {
      const res = await getTrackingByShipment(shipmentId);

      const raw = res.data;
      const data =
        Array.isArray(raw) ? raw :
        Array.isArray(raw.data) ? raw.data :
        [];

      setTrackingData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load tracking');
      setTrackingData([]);
    } finally {
      setLoading(false);
    }
  };

  // ── SOCKET SETUP (PRODUCTION READY)
  useEffect(() => {
    if (!shipmentId) return;

    const SOCKET_URL =
      process.env.REACT_APP_API_URL ||
      'https://freight-booking-system.onrender.com';

    // 🔥 Create socket with proper config
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'], // REQUIRED for Render
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    const socket = socketRef.current;

    // ✅ Debug logs
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Socket error:', err.message);
    });

    // Join shipment room
    socket.emit('joinShipment', shipmentId);
    console.log('📦 Joined shipment:', shipmentId);

    // Prevent duplicate listeners
    socket.off('trackingUpdated');

    // 🔥 Listen for real-time updates
    socket.on('trackingUpdated', (data) => {
      console.log('🔥 Live update:', data);

      setTrackingData(prev => [data, ...prev]);
      setLastUpdated(new Date());

      toast.success('🚀 Live tracking update!');
    });

    return () => {
      console.log('❌ Socket disconnected');
      socket.disconnect();
    };
  }, [shipmentId]);

  // ── POLLING (fallback safety)
  useEffect(() => {
    fetchTracking();

    intervalRef.current = setInterval(() => {
      fetchTracking();
    }, 10000);

    return () => clearInterval(intervalRef.current);
  }, [shipmentId]);

  // ── LOADING
  if (loading) {
    return <div className="p-10 text-center">Loading tracking...</div>;
  }

  // ── EMPTY
  if (trackingData.length === 0) {
    return <div className="p-10 text-center">No tracking data yet</div>;
  }

  const latest = trackingData[0];
  const latestLat = parseFloat(latest.latitude);
  const latestLng = parseFloat(latest.longitude);

  const positions = [...trackingData]
    .reverse()
    .map(t => [parseFloat(t.latitude), parseFloat(t.longitude)]);

  return (
    <div className="p-6">

      <h2 className="text-xl font-bold mb-3">
        Tracking — Shipment #{shipmentId}
      </h2>

      <p className="mb-2">
        Status: {statusLabels[latest.status] || latest.status}
      </p>

      {lastUpdated && (
        <p className="text-xs text-green-600 mb-3">
          ● Live (Last updated: {lastUpdated.toLocaleTimeString()})
        </p>
      )}

      <div style={{ height: 400 }}>
        <MapContainer
          center={[latestLat, latestLng]}
          zoom={10}
          style={{ height: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <MapUpdater lat={latestLat} lng={latestLng} />

          {positions.length > 1 && (
            <Polyline positions={positions} color="blue" />
          )}

          <Marker position={[latestLat, latestLng]}>
            <Popup>{latest.location}</Popup>
          </Marker>
        </MapContainer>
      </div>

    </div>
  );
}
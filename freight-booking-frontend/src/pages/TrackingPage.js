import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'react-toastify';
import { getTrackingByShipment } from '../services/trackingService';

// Fix Leaflet default icon broken image issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const statusLabels = {
  picked_up: '📦 Picked Up',
  in_transit: '🚛 In Transit',
  out_for_delivery: '🏍️ Out for Delivery',
  delivered: '✅ Delivered',
};

export default function TrackingPage() {
  const { shipmentId } = useParams();
  const [trackingData, setTrackingData] = useState([]);  // always array
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const res = await getTrackingByShipment(shipmentId);
        console.log('Tracking response:', res.data); // helpful for debugging

        // Safely extract array regardless of response shape
        const data = Array.isArray(res.data) ? res.data
                   : Array.isArray(res.data.data) ? res.data.data
                   : [];
        setTrackingData(data);
      } catch {
        toast.error('Could not load tracking data');
        setTrackingData([]); // fallback to empty array
      } finally {
        setLoading(false);
      }
    };
    fetchTracking();
  }, [shipmentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-lg">Loading tracking info...</p>
      </div>
    );
  }

  // No tracking data yet — show friendly message instead of crashing
  if (trackingData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto text-center py-20 bg-white rounded-lg shadow">
          <p className="text-4xl mb-4">📦</p>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No Tracking Data Yet
          </h2>
          <p className="text-gray-400">
            Shipment #{shipmentId} hasn't been picked up yet.
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Check back once the carrier updates the status.
          </p>
        </div>
      </div>
    );
  }

  const latest = trackingData[trackingData.length - 1];
  const positions = trackingData.map((t) => [
    parseFloat(t.latitude),
    parseFloat(t.longitude)
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">
          Tracking — Shipment #{shipmentId}
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Current Status:{' '}
          <strong>{statusLabels[latest.status] || latest.status}</strong>
          &nbsp;|&nbsp;
          Last Update: {new Date(latest.timestamp).toLocaleString()}
        </p>

        {/* Map */}
        <div className="rounded-lg overflow-hidden shadow mb-6">
          <MapContainer
            center={[parseFloat(latest.latitude), parseFloat(latest.longitude)]}
            zoom={10}
            style={{ height: '400px', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Polyline positions={positions} color="blue" weight={3} />
            <Marker position={[parseFloat(latest.latitude), parseFloat(latest.longitude)]}>
              <Popup>
                <strong>{statusLabels[latest.status]}</strong><br />
                {latest.location}<br />
                {new Date(latest.timestamp).toLocaleString()}
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* Tracking History Timeline */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Tracking History
          </h3>
          <div className="space-y-4">
            {[...trackingData].reverse().map((t, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full mt-1 ${
                    i === 0 ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                  {i !== trackingData.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 mt-1" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="font-medium text-gray-800">
                    {statusLabels[t.status] || t.status}
                  </p>
                  <p className="text-sm text-gray-500">{t.location}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(t.timestamp).toLocaleString()}
                  </p>
                  {t.notes && (
                    <p className="text-sm text-gray-600 mt-1 italic">{t.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'react-toastify';
import api from '../services/api'; // ✅ use the authenticated api instance directly

// Fix Leaflet broken default icon in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl:       require('leaflet/dist/images/marker-icon.png'),
  shadowUrl:     require('leaflet/dist/images/marker-shadow.png'),
});

const statusLabels = {
  picked_up:        '📦 Picked Up',
  in_transit:       '🚛 In Transit',
  out_for_delivery: '🏍️ Out for Delivery',
  delivered:        '✅ Delivered',
};

const statusColors = {
  picked_up:        'bg-blue-100 text-blue-700',
  in_transit:       'bg-yellow-100 text-yellow-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
  delivered:        'bg-green-100 text-green-700',
};

function MapUpdater({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], 10, { animate: true });
  }, [lat, lng, map]);
  return null;
}

export default function TrackingPage() {
  const { shipmentId } = useParams();
  const [trackingData, setTrackingData] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [lastUpdated, setLastUpdated]   = useState(null);
  const intervalRef                     = useRef(null);

  const fetchTracking = async (isPolling = false) => {
    try {
      // ✅ api instance automatically attaches Authorization header
      const res = await api.get(`/tracking/shipment/${shipmentId}`);
      console.log('Tracking response:', res.data);

      const raw = res.data;
      const data =
        Array.isArray(raw)            ? raw
        : Array.isArray(raw.data)     ? raw.data
        : Array.isArray(raw.tracking) ? raw.tracking
        : [];

      setTrackingData(data);
      setLastUpdated(new Date());

      if (isPolling && data.length > 0) {
        toast.info('📍 Tracking updated', { autoClose: 2000, position: 'bottom-right' });
      }
    } catch (err) {
      const status = err?.response?.status;
      console.error('Tracking fetch error:', status, err?.response?.data);

      if (!isPolling) {
        if (status === 403) {
          toast.error('You do not have permission to track this shipment.');
        } else if (status === 404) {
          toast.error('Shipment not found.');
        } else {
          toast.error('Could not load tracking data.');
        }
      }
      setTrackingData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking(false);
    intervalRef.current = setInterval(() => fetchTracking(true), 15000);
    return () => clearInterval(intervalRef.current);
  }, [shipmentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div style={{
            width: 40, height: 40, margin: '0 auto 12px',
            border: '3px solid #e5e7eb', borderTop: '3px solid #2563eb',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p className="text-gray-400 text-lg">Loading tracking info...</p>
        </div>
      </div>
    );
  }

  if (trackingData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto text-center py-20 bg-white rounded-lg shadow">
          <p className="text-4xl mb-4">📦</p>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Tracking Data Yet</h2>
          <p className="text-gray-400">Shipment #{shipmentId} hasn't been picked up yet.</p>
          <p className="text-gray-400 text-sm mt-1">Check back once the carrier updates the status.</p>
          <button
            onClick={() => fetchTracking(false)}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const latest    = trackingData[0];
  const latestLat = parseFloat(latest.latitude);
  const latestLng = parseFloat(latest.longitude);
  const positions = [...trackingData]
    .reverse()
    .map((t) => [parseFloat(t.latitude), parseFloat(t.longitude)]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            Tracking — Shipment #{shipmentId}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span>
              Current Status:{' '}
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[latest.status] || 'bg-gray-100 text-gray-600'}`}>
                {statusLabels[latest.status] || latest.status}
              </span>
            </span>
            <span>|</span>
            <span>Last Update: <strong>{new Date(latest.timestamp).toLocaleString('en-IN')}</strong></span>
            {lastUpdated && (
              <>
                <span>|</span>
                <span className="text-green-600 text-xs">● Live (refreshes every 15s)</span>
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl overflow-hidden shadow mb-6" style={{ height: 400 }}>
          <MapContainer center={[latestLat, latestLng]} zoom={10} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater lat={latestLat} lng={latestLng} />
            {positions.length > 1 && (
              <Polyline positions={positions} color="#2563eb" weight={3} opacity={0.7} />
            )}
            <Marker position={[latestLat, latestLng]}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong>{statusLabels[latest.status] || latest.status}</strong><br />
                  📍 {latest.location}<br />
                  🕐 {new Date(latest.timestamp).toLocaleString('en-IN')}
                  {latest.notes && <><br />📝 {latest.notes}</>}
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        <div className="bg-white shadow rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-gray-700">Tracking History</h3>
            <span className="text-xs text-gray-400">
              {trackingData.length} update{trackingData.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-0">
            {trackingData.map((t, i) => (
              <div key={t.id || i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                    i === 0 ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-gray-300'
                  }`} />
                  {i !== trackingData.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-200 my-1" style={{ minHeight: 32 }} />
                  )}
                </div>
                <div className="pb-5 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800 text-sm">
                        {statusLabels[t.status] || t.status}
                      </span>
                      {i === 0 && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">Latest</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(t.timestamp).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">📍 {t.location}</p>
                  {t.notes && <p className="text-sm text-gray-600 mt-1 italic">"{t.notes}"</p>}
                  <p className="text-xs text-gray-300 mt-1 font-mono">{t.latitude}, {t.longitude}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
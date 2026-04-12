import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getShipmentById } from '../services/shipmentService';
import { getReviewsByShipment } from '../services/reviewService';

export default function ShipmentDetails() {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shipRes, reviewRes] = await Promise.all([
          getShipmentById(id),
          getReviewsByShipment(id),
        ]);
        setShipment(shipRes.data);
        setReviews(reviewRes.data);
      } catch {
        toast.error('Failed to load shipment details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <p className="p-6 text-gray-400">Loading...</p>;
  if (!shipment) return <p className="p-6 text-red-500">Shipment not found.</p>;

  const fields = [
    { label: 'Pickup Location', value: shipment.pickup_location },
    { label: 'Delivery Location', value: shipment.delivery_location },
    { label: 'Freight Type', value: shipment.freight_type },
    { label: 'Weight', value: `${shipment.weight} kg` },
    { label: 'Quantity', value: shipment.quantity },
    { label: 'Pickup Date', value: shipment.scheduled_pickup_date?.split('T')[0] },
    { label: 'Delivery Date', value: shipment.scheduled_delivery_date?.split('T')[0] },
    { label: 'Price Quote', value: shipment.price_quote ? `₹${shipment.price_quote}` : 'Not set' },
    { label: 'Status', value: shipment.current_status },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="text-blue-600 text-sm hover:underline">← Back</Link>

        <div className="bg-white shadow rounded-lg p-6 mt-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Shipment #{shipment.id} Details
          </h1>

          <div className="grid grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.label} className="border-b pb-3">
                <p className="text-xs text-gray-400 uppercase font-medium">{f.label}</p>
                <p className="text-gray-800 font-medium mt-1">{f.value || '—'}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <Link
              to={`/track/${shipment.id}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded text-sm transition"
            >
              Track This Shipment
            </Link>
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mt-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Reviews</h2>
            {reviews.map((r) => (
              <div key={r.id} className="border-b pb-3 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <span className="text-sm text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-700 text-sm">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
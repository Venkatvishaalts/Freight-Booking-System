import { Link } from 'react-router-dom';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function ShipmentCard({ shipment, onAccept, showAccept, showDelete, onDelete }) {
  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4 border border-gray-100 hover:shadow-md transition">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">
            {shipment.pickup_location} → {shipment.delivery_location}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            📦 {shipment.freight_type} &nbsp;|&nbsp;
            ⚖️ {shipment.weight} kg &nbsp;|&nbsp;
            🔢 Qty: {shipment.quantity}
          </p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[shipment.current_status] || 'bg-gray-100 text-gray-600'}`}>
          {shipment.current_status}
        </span>
      </div>

      {/* Dates */}
      <div className="text-sm text-gray-500 mb-3">
        <span>📅 Pickup: {shipment.scheduled_pickup_date?.split('T')[0]}</span>
        <span className="ml-4">🏁 Delivery: {shipment.scheduled_delivery_date?.split('T')[0]}</span>
      </div>

      {/* Price */}
      {shipment.price_quote && (
        <p className="text-sm font-semibold text-green-700 mb-3">
          💰 ₹{shipment.price_quote}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 items-center flex-wrap">
        <Link
          to={`/shipments/${shipment.id}`}
          className="text-sm text-blue-600 hover:underline"
        >
          View Details →
        </Link>
        <Link
          to={`/track/${shipment.id}`}
          className="text-sm text-green-600 hover:underline"
        >
          Track Shipment
        </Link>

        {showAccept && (
          <button
            onClick={() => onAccept(shipment.id)}
            className="ml-auto bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded transition"
          >
            Accept Booking
          </button>
        )}

        {showDelete && (
          <button
            onClick={() => onDelete(shipment.id)}
            className="ml-auto bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-1.5 rounded transition"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
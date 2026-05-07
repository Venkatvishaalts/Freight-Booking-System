import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { getAllShipments } from '../services/shipmentService';
import { createBooking, getCarrierBookings } from '../services/bookingService';
import { addTrackingUpdate } from '../services/trackingService';
import { getMyFleet, publishRoute } from '../services/vehicleService';
import { assignVehicle, completeBooking, acceptBooking } from '../services/bookingService';
import { Link } from 'react-router-dom';
import { BsTruck, BsBoxSeam, BsClockHistory, BsCheckCircleFill, BsShareFill, BsGeoAltFill, BsX } from 'react-icons/bs';

export default function CarrierDashboard() {
  const { user } = useSelector((state) => state.auth);

  const [availableShipments, setAvailableShipments] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const [fetching, setFetching] = useState(true);
  const [fleet, setFleet] = useState([]);
  const [selectedVehicles, setSelectedVehicles] = useState({}); // bookingId -> vehicleId
  
  const [sharingModal, setSharingModal] = useState(null); // stores booking object
  const [routeForm, setRouteForm] = useState({
    source: '',
    destination: '',
    intermediate_points: '',
    estimated_arrival: ''
  });

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

      console.log("AVAILABLE API RESPONSE:", res.data);

      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.data)
        ? res.data.data
        : [];

      setAvailableShipments(data);
    } catch (err) {
      console.error(err);
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

      console.log("BOOKINGS API RESPONSE:", res.data);

      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.data)
        ? res.data.data
        : [];

      setMyBookings(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load your bookings');
      setMyBookings([]);
    } finally {
      setFetching(false);
    }
  };

  const fetchFleet = async () => {
    try {
      const res = await getMyFleet();
      setFleet(res.data.data || []);
    } catch (err) {
      console.error("Fleet fetch error:", err);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      if (activeTab === 'available') fetchAvailable();
      else {
        fetchMyBookings();
        fetchFleet();
      }
    }
  }, [activeTab, user]);

  const handleAssignVehicle = async (bookingId) => {
    const vehicleId = selectedVehicles[bookingId];
    if (!vehicleId) {
      toast.error('Please select a vehicle');
      return;
    }

    try {
      await assignVehicle(bookingId, vehicleId);
      toast.success('Vehicle assigned and shipment is now In Transit!');
      fetchMyBookings();
      fetchFleet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    }
  };

  const handleComplete = async (bookingId) => {
    try {
      await completeBooking(bookingId);
      toast.success('Shipment delivered and vehicle released!');
      fetchMyBookings();
      fetchFleet();
    } catch (err) {
      toast.error('Failed to complete booking');
    }
  };

  const handleApproveSharedBooking = async (bookingId) => {
    try {
      await acceptBooking(bookingId);
      toast.success('Shared booking approved! Shipment is now In Transit.');
      fetchMyBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    }
  };

  const handlePublishRoute = async (e) => {
    e.preventDefault();
    try {
      const vehicleId = sharingModal.shipment.vehicle_id;
      const intermediate_points = routeForm.intermediate_points.split(',').map(p => p.trim()).filter(p => p);
      
      await publishRoute(vehicleId, {
        ...routeForm,
        intermediate_points
      });
      
      toast.success('Route published! Users can now book shared space.');
      setSharingModal(null);
    } catch (err) {
      toast.error('Failed to publish route');
    }
  };

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

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <BsTruck className="text-blue-600" /> Carrier Dashboard
            </h1>
            <p className="text-gray-500 text-sm">
              Welcome back, {user?.username}
            </p>
          </div>
          <Link
            to="/fleet"
            className="bg-white border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition flex items-center gap-2 shadow-sm"
          >
            <BsTruck /> Manage Fleet
          </Link>
        </div>

        {/* TABS */}
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

        {/* ================= AVAILABLE SHIPMENTS ================= */}
        {activeTab === 'available' && (
          fetching ? (
            <p>Loading shipments...</p>
          ) : availableShipments.length === 0 ? (
            <p className="text-gray-500">No available shipments</p>
          ) : (
            availableShipments.map((s) => {
              console.log("Shipment object:", s);

              return (
                <div key={s.id} className="bg-white p-5 mb-4 rounded shadow">

                  <h2 className="text-lg font-semibold mb-2">
                    {s.pickup_location} → {s.delivery_location}
                  </h2>

                  <p className="text-gray-600">Weight: {s.weight} kg</p>
                  <p className="text-gray-600">Quantity: {s.quantity}</p>
                  <p className="text-gray-600">Freight Type: {s.freight_type}</p>

                  <button
                    onClick={() => handleAccept(s.id)}
                    className="bg-blue-600 text-white px-4 py-2 mt-3 rounded"
                  >
                    Accept Shipment
                  </button>

                </div>
              );
            })
          )
        )}

        {/* ================= MY BOOKINGS ================= */}
        {activeTab === 'mybookings' &&
          (fetching ? (
            <p>Loading bookings...</p>
          ) : myBookings.length === 0 ? (
            <p className="text-gray-500">No bookings yet</p>
          ) : (
            myBookings.map((b) => (
              <div key={b.id} className="bg-white p-5 mb-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">
                      {b.shipment?.pickup_location} → {b.shipment?.delivery_location}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <BsBoxSeam className="text-xs" /> {b.shipment?.freight_type} • {b.shipment?.weight}kg
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    b.shipment?.current_status === 'delivered' ? 'bg-green-100 text-green-700' :
                    b.shipment?.current_status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {b.shipment?.current_status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                  {/* Vehicle Assignment Area */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Assigned Vehicle</p>
                    {b.shipment?.vehicle_id ? (
                      <div className="flex items-center gap-2 text-gray-700 font-medium">
                        <BsTruck className="text-blue-500" />
                        {b.shipment.assigned_vehicle?.vehicle_number || 'Vehicle Assigned'}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <select
                          className="flex-1 text-sm border rounded p-2 bg-white"
                          value={selectedVehicles[b.id] || ''}
                          onChange={(e) => setSelectedVehicles({...selectedVehicles, [b.id]: e.target.value})}
                        >
                          <option value="">Select available vehicle</option>
                          {fleet.filter(v => v.status === 'available').map(v => (
                            <option key={v.id} value={v.id}>{v.vehicle_number} ({v.vehicle_type})</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAssignVehicle(b.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-blue-700 transition"
                        >
                          Assign
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions Area */}
                  <div className="flex items-center gap-3 justify-end">
                    {/* For Shared Bookings that are Pending */}
                    {b.shipment?.current_status === 'pending' && b.shipment?.vehicle_id && (
                      <button
                        onClick={() => handleApproveSharedBooking(b.id)}
                        className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                      >
                        <BsCheckCircleFill /> Approve Shared Booking
                      </button>
                    )}

                    {(['in_transit', 'confirmed', 'picked_up', 'out_for_delivery'].includes(b.shipment?.current_status)) && (
                      <>
                        <button
                          onClick={() => setTrackingModal(b.shipment_id)}
                          className="flex-1 md:flex-none border border-blue-600 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 transition flex items-center justify-center gap-2"
                        >
                          <BsClockHistory /> Update
                        </button>
                        <button
                          onClick={() => handleComplete(b.id)}
                          className="flex-1 md:flex-none bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition flex items-center justify-center gap-2"
                        >
                          <BsCheckCircleFill /> Complete
                        </button>
                      </>
                    )}
                    {(['in_transit', 'confirmed', 'picked_up', 'out_for_delivery'].includes(b.shipment?.current_status)) && (
                      <button
                        onClick={() => {
                          setSharingModal(b);
                          setRouteForm({
                            source: b.shipment.pickup_location,
                            destination: b.shipment.delivery_location,
                            intermediate_points: '',
                            estimated_arrival: ''
                          });
                        }}
                        className="flex-1 md:flex-none bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 transition flex items-center justify-center gap-2"
                      >
                        <BsShareFill /> Share Capacity
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ))}

        {/* ================= TRACKING MODAL ================= */}
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
                disabled={submitting}
                className="bg-blue-600 text-white px-4 py-2 w-full"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>

            </div>
          </div>
        )}

        {/* ================= SHARING MODAL ================= */}
        {sharingModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-xl w-96 max-w-full shadow-2xl">
              <h2 className="text-xl font-bold mb-2">Share Capacity</h2>
              <p className="text-sm text-gray-500 mb-6">Publish this route to allow others to book unused space.</p>

              <form onSubmit={handlePublishRoute}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Source</label>
                    <input
                      required
                      value={routeForm.source}
                      onChange={e => setRouteForm({...routeForm, source: e.target.value})}
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Destination</label>
                    <input
                      required
                      value={routeForm.destination}
                      onChange={e => setRouteForm({...routeForm, destination: e.target.value})}
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stops (Comma Separated)</label>
                    <input
                      placeholder="e.g. Surat, Vadodara"
                      value={routeForm.intermediate_points}
                      onChange={e => setRouteForm({...routeForm, intermediate_points: e.target.value})}
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estimated Arrival</label>
                    <input
                      type="datetime-local"
                      required
                      value={routeForm.estimated_arrival}
                      onChange={e => setRouteForm({...routeForm, estimated_arrival: e.target.value})}
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setSharingModal(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700"
                  >
                    Publish Route
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
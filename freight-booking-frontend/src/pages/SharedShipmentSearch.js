import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { FaSearch, FaTruck, FaMapMarkerAlt, FaWeightHanging, FaBoxOpen, FaRoute, FaCheckCircle, FaCalendarAlt } from 'react-icons/fa';

export default function SharedShipmentSearch() {
  const [searchParams, setSearchParams] = useState({
    pickup: '',
    destination: '',
    weight: ''
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.get('/vehicles/search', { params: searchParams });
      setResults(res.data.data || []);
      if (res.data.data.length === 0) toast.info('No vehicles found on this route with enough capacity.');
    } catch (err) {
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (route) => {
    const confirm = window.confirm(`Request shared booking on Vehicle ${route.vehicle.vehicle_number}?`);
    if (!confirm) return;

    setBookingLoading(route.route_id);
    try {
      await api.post('/vehicles/shared-booking', {
        route_id: route.route_id,
        pickup_location: searchParams.pickup,
        delivery_location: searchParams.destination,
        weight: searchParams.weight,
        freight_type: 'Shared Cargo',
        price_quote: 0 // In a real app, calculate dynamic price
      });
      toast.success('Shared booking request sent to carrier!');
      // Remove from results or update UI
      setResults(results.filter(r => r.route_id !== route.route_id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            Shared <span className="text-blue-600">Freight</span> Discovery
          </h1>
          <p className="text-gray-500 text-lg">Book affordable space on vehicles already traveling your way.</p>
        </header>

        {/* ── SEARCH CARD ── */}
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-100 p-8 mb-12 border border-blue-50">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Pickup City</label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-4 top-4 text-blue-500" />
                <input
                  required
                  placeholder="e.g. Pune"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  value={searchParams.pickup}
                  onChange={e => setSearchParams({...searchParams, pickup: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Destination</label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-4 top-4 text-green-500" />
                <input
                  required
                  placeholder="e.g. Mumbai"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  value={searchParams.destination}
                  onChange={e => setSearchParams({...searchParams, destination: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Weight (KG)</label>
              <div className="relative">
                <FaWeightHanging className="absolute left-4 top-4 text-gray-400" />
                <input
                  required
                  type="number"
                  placeholder="KG"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  value={searchParams.weight}
                  onChange={e => setSearchParams({...searchParams, weight: e.target.value})}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 h-[60px]"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <><FaSearch /> Find Vehicles</>
              )}
            </button>
          </form>
        </div>

        {/* ── RESULTS ── */}
        <div className="space-y-6">
          {results.length > 0 && <h2 className="text-xl font-bold text-gray-800 mb-4 px-2">{results.length} Matches Found Along Route</h2>}
          
          {results.map((r) => (
            <div key={r.route_id} className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 hover:shadow-xl transition-all group">
              <div className="flex flex-wrap md:flex-nowrap gap-6 items-center">
                
                {/* Vehicle Visual */}
                <div className="bg-blue-50 p-6 rounded-2xl flex flex-col items-center justify-center w-full md:w-32">
                  <FaTruck className="text-4xl text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold text-blue-800 uppercase text-center">{r.vehicle.vehicle_number}</span>
                </div>

                {/* Route Info */}
                <div className="flex-1 min-w-[300px]">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                      <div className="w-0.5 h-10 bg-gradient-to-b from-blue-500 to-green-500 opacity-20"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                    </div>
                    <div className="flex flex-col gap-6">
                      <div className="text-lg font-bold text-gray-800 leading-none">{r.source}</div>
                      <div className="text-lg font-bold text-gray-800 leading-none">{r.destination}</div>
                    </div>
                  </div>
                  
                  {r.intermediate_points?.length > 0 && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full w-fit">
                      <FaRoute className="text-blue-400" />
                      Stops: {r.intermediate_points.join(', ')}
                    </div>
                  )}
                </div>

                {/* Status & Booking */}
                <div className="w-full md:w-64 flex flex-col gap-4 border-l border-gray-100 pl-0 md:pl-6">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                      <span>Available Capacity</span>
                      <span className="text-blue-600">{r.remaining_capacity} KG</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full transition-all"
                        style={{ width: `${(r.remaining_capacity / r.vehicle.total_weight_capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                    <FaCalendarAlt className="text-gray-400" />
                    ETA: {r.estimated_arrival ? new Date(r.estimated_arrival).toLocaleString() : 'N/A'}
                  </div>

                  <button
                    onClick={() => handleBook(r)}
                    disabled={bookingLoading === r.route_id}
                    className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                  >
                    {bookingLoading === r.route_id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <><FaCheckCircle /> Request Booking</>
                    )}
                  </button>
                </div>

              </div>
            </div>
          ))}

          {!loading && results.length === 0 && searchParams.pickup && (
            <div className="text-center p-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <FaBoxOpen className="text-6xl text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400">No active routes found</h3>
              <p className="text-gray-400 max-w-xs mx-auto mt-2">
                Try searching for major cities or hubs, or check back later as carriers publish routes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

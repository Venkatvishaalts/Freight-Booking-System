import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getMyFleet, addVehicle, deleteVehicle } from '../services/vehicleService';
import { FaTruck, FaTrash, FaPlus, FaIdCard, FaPhone } from 'react-icons/fa';

export default function FleetManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: 'truck',
    total_weight_capacity: '',
    driver_name: '',
    driver_phone: ''
  });

  const fetchFleet = async () => {
    try {
      const res = await getMyFleet();
      setVehicles(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load fleet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    const cleanedData = {
      vehicle_number: formData.vehicle_number,
      vehicle_type: formData.vehicle_type,
      total_weight_capacity: formData.total_weight_capacity || null,
      driver_name: formData.driver_name || null,
      driver_phone: formData.driver_phone || null
    };

    try {
      await addVehicle(cleanedData);
      toast.success('Vehicle added successfully');
      setShowModal(false);
      setFormData({
        vehicle_number: '',
        vehicle_type: 'truck',
        total_weight_capacity: '',
        driver_name: '',
        driver_phone: ''
      });
      fetchFleet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add vehicle');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this vehicle?')) {
      try {
        await deleteVehicle(id);
        toast.success('Vehicle removed');
        fetchFleet();
      } catch (err) {
        toast.error('Failed to delete vehicle');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Fleet Management</h1>
            <p className="text-gray-600">Manage your delivery vehicles and drivers</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-lg"
          >
            <FaPlus /> Add Vehicle
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.length === 0 ? (
              <div className="col-span-full bg-white p-12 rounded-xl shadow text-center">
                <FaTruck className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-xl">No vehicles in your fleet yet.</p>
              </div>
            ) : (
              vehicles.map(v => (
                <div key={v.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200">
                  <div className={`p-4 ${v.status === 'available' ? 'bg-green-50' : v.status === 'out_for_delivery' ? 'bg-blue-50' : 'bg-yellow-50'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg shadow-sm">
                          <FaTruck className="text-2xl text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 uppercase">{v.vehicle_number}</h3>
                          <p className="text-xs text-gray-500 uppercase font-semibold">{v.vehicle_type}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          v.status === 'available' ? 'bg-green-200 text-green-800' : 
                          v.status === 'out_for_delivery' ? 'bg-blue-200 text-blue-800' : 
                          'bg-yellow-200 text-yellow-800'
                        }`}>
                          {v.status.replace(/_/g, ' ')}
                        </span>
                        {v.status === 'out_for_delivery' && (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            v.capacity_status === 'full' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {v.capacity_status} capacity
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <FaIdCard className="text-gray-400" />
                      <span>{v.driver_name || 'No driver assigned'}</span>
                    </div>
                    {v.driver_phone && (
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <FaPhone className="text-gray-400" />
                        <span>{v.driver_phone}</span>
                      </div>
                    )}
                    
                    {v.total_weight_capacity && (
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-1">
                          <span>Usage: {v.used_weight_capacity} / {v.total_weight_capacity} kg</span>
                          <span>{Math.round((v.used_weight_capacity / v.total_weight_capacity) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              v.used_weight_capacity >= v.total_weight_capacity ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(100, (v.used_weight_capacity / v.total_weight_capacity) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-4 mt-4 border-t flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-tighter">
                        Vol: {v.capacity_kg} KG
                      </span>
                      <button 
                        onClick={() => handleDelete(v.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ADD VEHICLE MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
              <div className="bg-blue-600 p-6 text-white">
                <h2 className="text-2xl font-bold">Add New Vehicle</h2>
                <p className="text-blue-100 opacity-80">Enter your fleet details</p>
              </div>
              <form onSubmit={handleAddVehicle} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Vehicle Number</label>
                  <input
                    required
                    className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 border p-3"
                    placeholder="e.g. MH-12-AB-1234"
                    value={formData.vehicle_number}
                    onChange={e => setFormData({...formData, vehicle_number: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                    <select
                      className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 border p-3"
                      value={formData.vehicle_type}
                      onChange={e => setFormData({...formData, vehicle_type: e.target.value})}
                    >
                      <option value="bike">Bike</option>
                      <option value="van">Van</option>
                      <option value="truck">Truck</option>
                      <option value="mini_truck">Mini Truck</option>
                      <option value="container_truck">Container Truck</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Total Payload (KG)</label>
                    <input
                      required
                      type="number"
                      className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 border p-3"
                      placeholder="e.g. 1000"
                      value={formData.total_weight_capacity}
                      onChange={e => setFormData({...formData, total_weight_capacity: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Driver Name</label>
                  <input
                    className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 border p-3"
                    placeholder="Full Name"
                    value={formData.driver_name}
                    onChange={e => setFormData({...formData, driver_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Driver Phone</label>
                  <input
                    className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 border p-3"
                    placeholder="e.g. 9876543210"
                    value={formData.driver_phone}
                    onChange={e => setFormData({...formData, driver_phone: e.target.value})}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md"
                  >
                    Save Vehicle
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

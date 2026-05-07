import api from './api';

export const addVehicle = async (vehicleData) => {
  return await api.post('/vehicles', vehicleData);
};

export const getMyFleet = async () => {
  return await api.get('/vehicles/my-fleet');
};

export const updateVehicle = async (id, vehicleData) => {
  return await api.put(`/vehicles/${id}`, vehicleData);
};

export const deleteVehicle = async (id) => {
  return await api.delete(`/vehicles/${id}`);
};

export const publishRoute = async (vehicleId, routeData) => {
  return await api.post(`/vehicles/${vehicleId}/publish-route`, routeData);
};

export const getVehicleRoutes = async (vehicleId) => {
  return await api.get(`/vehicles/${vehicleId}/routes`);
};

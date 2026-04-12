import api from './api';

export const getTrackingByShipment = (shipmentId) => api.get(`/tracking/${shipmentId}`);
export const addTrackingUpdate = (data) => api.post('/tracking', data);
import api from './api';

export const getAllShipments = (filters) => api.get('/shipments', { params: filters });
export const getShipmentById = (id) => api.get(`/shipments/${id}`);
export const createShipment = (data) => api.post('/shipments', data);
export const updateShipment = (id, data) => api.put(`/shipments/${id}`, data);
export const deleteShipment = (id) => api.delete(`/shipments/${id}`);
export const getShipperShipments = (shipperId) => api.get(`/shipments/shipper/${shipperId}`);
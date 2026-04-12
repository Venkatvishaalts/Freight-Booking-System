import api from './api';

export const createBooking = (data) => api.post('/bookings', data);
export const getBookingById = (id) => api.get(`/bookings/${id}`);
export const updateBooking = (id, data) => api.put(`/bookings/${id}`, data);
export const getCarrierBookings = (carrierId) => api.get(`/bookings/carrier/${carrierId}`);
export const getAllBookings = () => api.get('/bookings');
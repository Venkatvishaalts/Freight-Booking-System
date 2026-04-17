import api from './api';

// ================= CREATE =================
export const createBooking = (data) => {
  return api.post('/bookings', data);
};

// ================= GET =================
export const getBookingById = (id) => {
  return api.get(`/bookings/${id}`);
};

export const getCarrierBookings = (carrierId) => {
  return api.get(`/bookings/carrier/${carrierId}`);
};

export const getAllBookings = () => {
  return api.get('/bookings');
};

// ================= UPDATE =================
export const updateBooking = (id, data) => {
  return api.put(`/bookings/${id}`, data);
};

// ================= ✅ NEW: ACCEPT BOOKING =================
export const acceptBooking = (bookingId) => {
  return api.put(`/bookings/${bookingId}/accept`);
};
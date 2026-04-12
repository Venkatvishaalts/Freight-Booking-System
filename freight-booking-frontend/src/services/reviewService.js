import api from './api';

export const postReview = (data) => api.post('/reviews', data);
export const getReviewsByUser = (userId) => api.get(`/reviews/${userId}`);
export const getReviewsByShipment = (shipmentId) => api.get(`/reviews/shipment/${shipmentId}`);
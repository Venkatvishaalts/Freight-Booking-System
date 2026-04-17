import axios from 'axios';

// ✅ DEBUG: check if env is loaded
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

console.log("🌐 API BASE URL:", BASE_URL);

// ❗ Fallback (VERY IMPORTANT for safety)
const api = axios.create({
  baseURL: BASE_URL || "https://freight-booking-system.onrender.com/api"
});

// ================= REQUEST INTERCEPTOR =================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ================= RESPONSE INTERCEPTOR =================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ API ERROR:", error?.response || error);

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
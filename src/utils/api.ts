// @ts-nocheck
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('servos_jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (err) => Promise.reject(err));

export const api = {
  // Auth
  login: async (credentials) => {
    const res = await client.post('/auth/login', credentials);
    if (res.data.success) {
      sessionStorage.setItem('servos_jwt', res.data.data.token);
    }
    return res.data;
  },
  register: async (data) => {
    const res = await client.post('/auth/register', data);
    return res.data;
  },

  // Bookings
  getBookings: async () => {
    const res = await client.get('/bookings');
    return res.data;
  },
  createBooking: async (data) => {
    const res = await client.post('/bookings', data);
    return res.data;
  },
  assignWorker: async (bookingId, workerId) => {
    const res = await client.post(`/bookings/${bookingId}/assign`, { workerId });
    return res.data;
  },

  // Admin
  saveConfig: async (config) => {
    const res = await client.put('/admin/tenant/config', config);
    return res.data;
  },
  createService: async (service) => {
    const res = await client.post('/admin/services', service);
    return res.data;
  },
  getWorkers: async () => {
    const res = await client.get('/admin/workers');
    return res.data;
  }
};

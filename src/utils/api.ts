// @ts-nocheck
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? '/api' : 'http://localhost:5000/api');

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('servos_jwt') || localStorage.getItem('servos_jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const tenantId = sessionStorage.getItem('anarav_site_tenant_id') || localStorage.getItem('anarav_site_tenant_id');
  if (tenantId) {
    config.headers['x-tenant-id'] = tenantId;
  }
  return config;
}, (err) => Promise.reject(err));

export const api = {
  // ── Auth ──────────────────────────────────────────
  login: async (credentials) => {
    const res = await client.post('/auth/login', credentials);
    if (res.data?.data?.token) {
      sessionStorage.setItem('servos_jwt', res.data.data.token);
      localStorage.setItem('servos_jwt', res.data.data.token);
    }
    return res.data;
  },
  register: async (data) => {
    const res = await client.post('/auth/register', data);
    if (res.data?.data?.token) {
      sessionStorage.setItem('servos_jwt', res.data.data.token);
      localStorage.setItem('servos_jwt', res.data.data.token);
    }
    return res.data;
  },

  // ── Customer Auth Scoped to Tenant ────────────────
  customerRegister: async (data) => {
    const res = await client.post('/auth/customer/register', data);
    if (res.data?.data?.token) {
      sessionStorage.setItem(`servos_customer_jwt_${data.tenantId || 'global'}`, res.data.data.token);
    }
    return res.data;
  },
  customerLogin: async (credentials) => {
    const res = await client.post('/auth/customer/login', credentials);
    if (res.data?.data?.token) {
      sessionStorage.setItem(`servos_customer_jwt_${credentials.tenantId || 'global'}`, res.data.data.token);
    }
    return res.data;
  },

  // ── Tenant & Auto-Generated Website ───────────────
  registerTenant: async (tenantData) => {
    const res = await client.post('/tenants/register', tenantData);
    if (res.data?.data?.token) {
      sessionStorage.setItem('servos_jwt', res.data.data.token);
      localStorage.setItem('servos_jwt', res.data.data.token);
    }
    return res.data;
  },
  loginTenant: async (credentials) => {
    const res = await client.post('/tenants/login', credentials);
    if (res.data?.data?.token) {
      sessionStorage.setItem('servos_jwt', res.data.data.token);
      localStorage.setItem('servos_jwt', res.data.data.token);
    }
    return res.data;
  },
  resolveTenant: async (slug: string) => {
    const res = await client.get(`/tenants/resolve/${encodeURIComponent(slug)}`);
    return res.data;
  },
  getTenants: async () => {
    const res = await client.get('/tenants');
    return res.data;
  },
  getCurrentTenant: async () => {
    const res = await client.get('/tenants/current');
    return res.data;
  },
  updateTenant: async (id: string, tenantData) => {
    const res = await client.put(`/tenants/${id}`, tenantData);
    return res.data;
  },

  // ── CMS Website Pages ─────────────────────────────
  getWebsitePages: async (slug: string) => {
    const res = await client.get(`/websites/pages/${encodeURIComponent(slug)}`);
    return res.data;
  },
  getAdminPages: async () => {
    const res = await client.get('/websites/admin/pages');
    return res.data;
  },
  saveAdminPage: async (pageData) => {
    const res = await client.post('/websites/admin/pages', pageData);
    return res.data;
  },
  deleteAdminPage: async (id: string) => {
    const res = await client.delete(`/websites/admin/pages/${id}`);
    return res.data;
  },

  // ── Products ──────────────────────────────────────
  getProducts: async (tenantId?: string) => {
    const url = tenantId ? `/products?tenantId=${encodeURIComponent(tenantId)}` : '/products';
    const res = await client.get(url);
    return res.data;
  },
  getAdminProducts: async () => {
    const res = await client.get('/products/admin');
    return res.data;
  },
  createProduct: async (product) => {
    const res = await client.post('/products', product);
    return res.data;
  },
  updateProduct: async (id: string, product) => {
    const res = await client.put(`/products/${id}`, product);
    return res.data;
  },
  deleteProduct: async (id: string) => {
    const res = await client.delete(`/products/${id}`);
    return res.data;
  },

  // ── Services ──────────────────────────────────────
  getServices: async (tenantId?: string) => {
    const url = tenantId ? `/services?tenantId=${encodeURIComponent(tenantId)}` : '/services';
    const res = await client.get(url);
    return res.data;
  },
  createService: async (service) => {
    const res = await client.post('/services', service);
    return res.data;
  },
  updateService: async (id: string, service) => {
    const res = await client.put(`/services/${id}`, service);
    return res.data;
  },
  deleteService: async (id: string) => {
    const res = await client.delete(`/services/${id}`);
    return res.data;
  },

  // ── Orders & Checkout ─────────────────────────────
  createOrder: async (orderData) => {
    const res = await client.post('/orders', orderData);
    return res.data;
  },
  getOrders: async (params?: { status?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    const res = await client.get(`/orders${query ? `?${query}` : ''}`);
    return res.data;
  },
  getOrderById: async (id: string) => {
    const res = await client.get(`/orders/${id}`);
    return res.data;
  },
  updateOrderStatus: async (id: string, status: string) => {
    const res = await client.put(`/orders/${id}/status`, { status });
    return res.data;
  },

  // ── Payments ──────────────────────────────────────
  processPayment: async (paymentData) => {
    const res = await client.post('/payments/process', paymentData);
    return res.data;
  },
  getPayments: async () => {
    const res = await client.get('/payments');
    return res.data;
  },

  // ── Files & Supabase S3 ──────────────────────────
  getFiles: async () => {
    const res = await client.get('/files');
    return res.data;
  },
  uploadFile: async (fileData) => {
    const res = await client.post('/files', fileData);
    return res.data;
  },
  uploadBinaryFile: async (file: File | Blob, folder: string = 'uploads') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    const res = await client.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  },
  deleteFile: async (id: string) => {
    const res = await client.delete(`/files/${id}`);
    return res.data;
  },

  // ── Notifications ─────────────────────────────────
  getNotifications: async () => {
    const res = await client.get('/notifications');
    return res.data;
  },
  markNotificationRead: async (id: string) => {
    const res = await client.put(`/notifications/${id}/read`);
    return res.data;
  },
  markAllNotificationsRead: async () => {
    const res = await client.put('/notifications/read-all');
    return res.data;
  },

  // ── Audit Logs ────────────────────────────────────
  getTenantAuditLogs: async () => {
    const res = await client.get('/audit/tenant');
    return res.data;
  },
  getGlobalAuditLogs: async () => {
    const res = await client.get('/audit/global');
    return res.data;
  },

  // ── Bookings & Leads ──────────────────────────────
  getBookings: async (tenantId?: string, customerId?: string) => {
    const params = new URLSearchParams();
    if (tenantId) params.append('tenantId', tenantId);
    if (customerId) params.append('customerId', customerId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await client.get(`/bookings${queryString}`);
    return res.data;
  },
  createBooking: async (data) => {
    const res = await client.post('/bookings', data);
    return res.data;
  },
  updateBookingStatus: async (id: string, status: string) => {
    const res = await client.put(`/bookings/${id}/status`, { status });
    return res.data;
  },
  assignWorker: async (bookingId: string, workerId: string) => {
    const res = await client.post(`/bookings/${bookingId}/assign`, { workerId });
    return res.data;
  },
  getLeads: async (tenantId?: string) => {
    const url = tenantId ? `/leads?tenantId=${encodeURIComponent(tenantId)}` : '/leads';
    const res = await client.get(url);
    return res.data;
  },
  createLead: async (leadData) => {
    const res = await client.post('/leads', leadData);
    return res.data;
  },
  updateLead: async (id: string, leadData) => {
    const res = await client.put(`/leads/${id}`, leadData);
    return res.data;
  },
  deleteLead: async (id: string) => {
    const res = await client.delete(`/leads/${id}`);
    return res.data;
  },

  // ── Custom Domains & Vercel Mapping ───────────────
  getDomainStatus: async (tenantId: string) => {
    const res = await client.get(`/domains/status?tenantId=${encodeURIComponent(tenantId)}`);
    return res.data;
  },
  addDomain: async (tenantId: string, domain: string) => {
    const res = await client.post('/domains/add', { tenantId, domain });
    return res.data;
  },
  verifyDomain: async (tenantId: string, domain: string) => {
    const res = await client.post('/domains/verify', { tenantId, domain });
    return res.data;
  },
  removeDomain: async (tenantId: string, domain?: string) => {
    const res = await client.delete('/domains/remove', { data: { tenantId, domain } });
    return res.data;
  },
  resolveDomain: async (domain: string) => {
    const res = await client.get(`/domains/resolve?domain=${encodeURIComponent(domain)}`);
    return res.data;
  }
};


import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 → redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// =====================
// Branch API
// =====================
export const branchApi = {
  getAll: () => api.get('/branches'),
  create: (data: { name: string; address: string; phone: string }) => api.post('/branches', data),
  update: (id: string, data: { name?: string; address?: string; phone?: string }) => api.put(`/branches/${id}`, data),
  delete: (id: string) => api.delete(`/branches/${id}`),
}

// =====================
// Stock / Materials API
// =====================
export const stockApi = {
  getAll: (branchId?: string) => api.get('/stock', { params: branchId ? { branch_id: branchId } : {} }),
  getById: (id: number) => api.get(`/stock/items/${id}`),
  create: (data: { name: string; category_id: number; unit: string; min_stock_level: number }) =>
    api.post('/stock/items', data),
  update: (id: number, data: { name?: string; category_id?: number; unit?: string; min_stock_level?: number }) =>
    api.put(`/stock/items/${id}`, data),
  delete: (id: number) => api.delete(`/stock/items/${id}`),
  purchase: (data: { material_id: number; supplier_id: number; quantity: number; total_price: number; receipt_no?: string }) =>
    api.post('/stock/purchase', data),
  deduct: (data: { material_id: number; quantity: number; job_id?: number; notes?: string }) =>
    api.post('/stock/deduct', data),
  compare: (materialId: number) => api.get(`/stock/compare/${materialId}`),
}

// =====================
// Admin API
// =====================
export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  createUser: (data: { email: string; password: string; full_name: string; role: string; branch_id: string }) =>
    api.post('/admin/users', data),
  updateUserRole: (id: string, data: { role: string; branch_id: string }) =>
    api.put(`/admin/users/${id}/role`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getLogs: (branchId?: string) => api.get('/admin/logs', { params: branchId ? { branch_id: branchId } : {} }),
}

// =====================
// Stats API
// =====================
export const statsApi = {
  getDashboard: (branchId?: string) => api.get('/stats/dashboard', { params: branchId ? { branch_id: branchId } : {} }),
  getChart: (branchId?: string) => api.get('/stats/chart', { params: branchId ? { branch_id: branchId } : {} }),
  getSummary: (branchId?: string, period?: string) =>
    api.get('/stats/summary', { params: { ...(branchId ? { branch_id: branchId } : {}), ...(period ? { period } : {}) } }),
}

// =====================
// Custom/Legacy API
// =====================
export const orderApi = {
  getAll: (branchId?: string) => api.get('/orders', { params: branchId ? { branch_id: branchId } : {} }),
  getById: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
}

export const productApi = {
  getAll: (branchId?: string) => api.get('/products', { params: branchId ? { branch_id: branchId } : {} }),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
}

export default api

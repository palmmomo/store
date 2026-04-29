import axios from 'axios'
import type { QuotationItem } from '../types'

let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
if (API_URL.endsWith('/')) API_URL = API_URL.slice(0, -1)

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
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

export const stockApi = {
  getAll: () => api.get('/stock'),
  getById: (id: number) => api.get(`/stock/${id}`),
  create: (d: { name: string; unit: string; quantity?: number }) => api.post('/stock', d),
  update: (id: number, d: { name?: string; unit?: string; quantity?: number }) => api.put(`/stock/${id}`, d),
  delete: (id: number) => api.delete(`/stock/${id}`),
}

export const purchaseApi = {
  getAll: () => api.get('/purchases'),
  create: (d: { item_id: number; quantity: number; price_per_unit?: number; total_price?: number; supplier?: string; note?: string }) => api.post('/purchases', d),
  update: (id: number, d: { item_id?: number; quantity?: number; price_per_unit?: number; total_price?: number; supplier?: string; note?: string }) => api.put(`/purchases/${id}`, d),
  delete: (id: number) => api.delete(`/purchases/${id}`),
}

export const withdrawalApi = {
  getAll: () => api.get('/withdrawals'),
  create: (d: { item_id: number; quantity: number; purpose?: string }) => api.post('/withdrawals', d),
  update: (id: number, d: { item_id?: number; quantity?: number; purpose?: string }) => api.put(`/withdrawals/${id}`, d),
  delete: (id: number) => api.delete(`/withdrawals/${id}`),
}

export const branchApi = {
  getAll: () => api.get('/branches'),
  create: (d: { name: string; address?: string; phone?: string; tax_id?: string }) => api.post('/branches', d),
  update: (id: number, d: { name?: string; address?: string; phone?: string; tax_id?: string }) => api.put(`/branches/${id}`, d),
  delete: (id: number) => api.delete(`/branches/${id}`),
}

export const quotationApi = {
  getAll: () => api.get('/quotations'),
  create: (d: { branch_id?: number; customer_name?: string; customer_address?: string; customer_tax_id?: string; items: QuotationItem[]; total_amount: number; total_in_words: string; status?: string }) => api.post('/quotations', d),
  update: (id: number, d: { branch_id?: number; customer_name?: string; customer_address?: string; customer_tax_id?: string; items?: QuotationItem[]; total_amount?: number; total_in_words?: string; status?: string }) => api.put(`/quotations/${id}`, d),
  delete: (id: number) => api.delete(`/quotations/${id}`),
  createJob: (id: number) => api.post(`/quotations/${id}/create-job`),
}

export const jobApi = {
  getAll: () => api.get('/jobs'),
  create: (d: { title: string; description?: string; status?: string; payment_status?: string; price?: number; assigned_to?: string; quotation_id?: number }) => api.post('/jobs', d),
  update: (id: number, d: { title?: string; description?: string; status?: string; payment_status?: string; price?: number; assigned_to?: string }) => api.put(`/jobs/${id}`, d),
  delete: (id: number) => api.delete(`/jobs/${id}`),
}

export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  createUser: (d: { email: string; password: string; role: string }) => api.post('/admin/users', d),
  updateUserRole: (id: string, d: { role: string }) => api.put(`/admin/users/${id}/role`, d),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getHistory: () => api.get('/admin/history'),
}

export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
}

export default api

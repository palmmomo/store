import axios from 'axios'
import {
  mockBranches, mockProducts, mockStock, mockStockLogs,
  mockOrders, mockDashboard, mockChartData, mockUsers, mockResp,
} from './mockData'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS === 'true'

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401
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
// Auth API
// =====================
export const authApi = {
  login: (email: string, password: string) => {
    if (DEV_BYPASS || (email === 'admin' && password === 'admin')) {
      return mockResp({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: { id: 'dev-user', email, role: 'superadmin', branch_id: '' },
      })
    }
    return api.post('/auth/login', { email, password })
  },
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refresh_token: refreshToken }),
}

// =====================
// Branch API
// =====================
export const branchApi = {
  getAll: () => DEV_BYPASS ? mockResp(mockBranches) : api.get('/branches'),
  create: (data: { name: string; address: string; phone: string }) => {
    if (DEV_BYPASS) {
      const branch = { id: `b-${Date.now()}`, ...data, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      mockBranches.push(branch)
      return mockResp(branch)
    }
    return api.post('/branches', data)
  },
  update: (id: string, data: Partial<{ name: string; address: string; phone: string; is_active: boolean }>) => {
    if (DEV_BYPASS) {
      const idx = mockBranches.findIndex(b => b.id === id)
      if (idx >= 0) Object.assign(mockBranches[idx], data)
      return mockResp(mockBranches[idx])
    }
    return api.put(`/branches/${id}`, data)
  },
  delete: (id: string) => {
    if (DEV_BYPASS) {
      const idx = mockBranches.findIndex(b => b.id === id)
      if (idx >= 0) mockBranches[idx].is_active = false
      return mockResp({ message: 'deleted' })
    }
    return api.delete(`/branches/${id}`)
  },
}

// =====================
// Product API
// =====================
export const productApi = {
  getAll: (_branchId?: string) => DEV_BYPASS ? mockResp(mockProducts) : api.get('/products', { params: _branchId ? { branch_id: _branchId } : {} }),
  getOne: (id: string) => DEV_BYPASS ? mockResp(mockProducts.find(p => p.id === id)) : api.get(`/products/${id}`),
  create: (data: { branch_id: string; name: string; price: number; category: string; image_url?: string }) => {
    if (DEV_BYPASS) {
      const p = { id: `p-${Date.now()}`, ...data, image_url: data.image_url || '', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      mockProducts.push(p)
      return mockResp(p)
    }
    return api.post('/products', data)
  },
  update: (id: string, data: Partial<{ name: string; price: number; category: string; image_url: string; is_active: boolean }>) => {
    if (DEV_BYPASS) {
      const idx = mockProducts.findIndex(p => p.id === id)
      if (idx >= 0) Object.assign(mockProducts[idx], data)
      return mockResp(mockProducts[idx])
    }
    return api.put(`/products/${id}`, data)
  },
  delete: (id: string) => {
    if (DEV_BYPASS) {
      const idx = mockProducts.findIndex(p => p.id === id)
      if (idx >= 0) mockProducts[idx].is_active = false
      return mockResp({ message: 'deleted' })
    }
    return api.delete(`/products/${id}`)
  },
}

// =====================
// Stock API
// =====================
export const stockApi = {
  getAll: (_branchId?: string) => DEV_BYPASS ? mockResp(mockStock) : api.get('/stock', { params: _branchId ? { branch_id: _branchId } : {} }),
  create: (data: { product_id: string; branch_id: string; quantity: number; min_level: number; unit: string }) => {
    if (DEV_BYPASS) {
      const item = { id: `s-${Date.now()}`, ...data, updated_at: new Date().toISOString() }
      mockStock.push(item)
      return mockResp(item)
    }
    return api.post('/stock', data)
  },
  update: (id: string, data: { change: number; reason: string }) => {
    if (DEV_BYPASS) {
      const item = mockStock.find(s => s.id === id)
      if (item) {
        item.quantity = Math.max(0, item.quantity + data.change)
        mockStockLogs.unshift({ id: `l-${Date.now()}`, product_id: item.product_id, branch_id: item.branch_id, change: data.change, reason: data.reason, user_id: 'dev-user', created_at: new Date().toISOString(), products: item.products ? { name: item.products.name, category: item.products.category } : undefined })
      }
      return mockResp(item)
    }
    return api.put(`/stock/${id}`, data)
  },
  getLogs: (_branchId?: string) => DEV_BYPASS ? mockResp(mockStockLogs) : api.get('/stock/logs', { params: _branchId ? { branch_id: _branchId } : {} }),
}

// =====================
// Order API
// =====================
export const orderApi = {
  getAll: (_branchId?: string, _status?: string) => DEV_BYPASS ? mockResp(mockOrders) : api.get('/orders', { params: { ...(_branchId ? { branch_id: _branchId } : {}), ...(_status ? { status: _status } : {}) } }),
  getOne: (id: string) => DEV_BYPASS ? mockResp(mockOrders.find(o => o.id === id)) : api.get(`/orders/${id}`),
  create: (data: { branch_id: string; note?: string; items: { product_id: string; quantity: number; price: number }[] }) => {
    if (DEV_BYPASS) {
      const total = data.items.reduce((s, i) => s + i.price * i.quantity, 0)
      const order = {
        id: `order-${Date.now()}-mock`,
        branch_id: data.branch_id,
        user_id: 'dev-user',
        total,
        status: 'completed' as const,
        note: data.note || '',
        created_at: new Date().toISOString(),
        order_items: data.items.map((item, idx) => ({
          id: `oi-${idx}`,
          order_id: `order-${Date.now()}`,
          ...item,
          products: mockProducts.find(p => p.id === item.product_id) ? { name: mockProducts.find(p => p.id === item.product_id)!.name, category: mockProducts.find(p => p.id === item.product_id)!.category } : undefined,
        })),
      }
      mockOrders.unshift(order)
      return mockResp(order)
    }
    return api.post('/orders', data)
  },
}

// =====================
// Stats API
// =====================
export const statsApi = {
  getDashboard: (_branchId?: string) => DEV_BYPASS ? mockResp(mockDashboard) : api.get('/stats/dashboard', { params: _branchId ? { branch_id: _branchId } : {} }),
  getChart: (_branchId?: string) => DEV_BYPASS ? mockResp(mockChartData) : api.get('/stats/chart', { params: _branchId ? { branch_id: _branchId } : {} }),
  getSummary: (_branchId?: string, period?: string) => {
    if (DEV_BYPASS) {
      const days = period === 'day' ? 1 : period === 'week' ? 7 : 30
      const recentOrders = mockOrders.slice(0, days * 3)
      return mockResp({ period, total_orders: recentOrders.length, total_revenue: recentOrders.reduce((s, o) => s + o.total, 0), orders: recentOrders })
    }
    return api.get('/stats/summary', { params: { ...(_branchId ? { branch_id: _branchId } : {}), ...(period ? { period } : {}) } })
  },
}

// =====================
// Admin API
// =====================
export const adminApi = {
  getUsers: () => DEV_BYPASS ? mockResp({ users: mockUsers }) : api.get('/admin/users'),
  inviteUser: (data: { email: string; role: string; branch_id: string }) => {
    if (DEV_BYPASS) {
      const u = { id: `u-${Date.now()}`, email: data.email, created_at: new Date().toISOString(), app_metadata: { role: data.role, branch_id: data.branch_id } }
      mockUsers.push(u)
      return mockResp(u)
    }
    return api.post('/admin/users', data)
  },
  updateUserRole: (id: string, data: { role: string; branch_id: string }) => {
    if (DEV_BYPASS) {
      const u = mockUsers.find(u => u.id === id)
      if (u) u.app_metadata = { role: data.role, branch_id: data.branch_id }
      return mockResp(u)
    }
    return api.put(`/admin/users/${id}/role`, data)
  },
  deleteUser: (id: string) => {
    if (DEV_BYPASS) {
      const idx = mockUsers.findIndex(u => u.id === id)
      if (idx >= 0) mockUsers.splice(idx, 1)
      return mockResp({ message: 'deleted' })
    }
    return api.delete(`/admin/users/${id}`)
  },
  getLogs: (_branchId?: string) => DEV_BYPASS ? mockResp(mockStockLogs) : api.get('/admin/logs', { params: _branchId ? { branch_id: _branchId } : {} }),
}

export default api

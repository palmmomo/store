// ==========================================
// MOCK DATA — ใช้เมื่อ VITE_DEV_BYPASS=true
// ==========================================

import type { Branch, Product, StockItem, StockLog, Order, DashboardStats, SalesChartData } from '../types'

export const mockBranches: Branch[] = [
  { id: 'b1', name: 'สาขาลาดพร้าว', address: '123 ถ.ลาดพร้าว กรุงเทพฯ', phone: '02-111-1111', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'b2', name: 'สาขาสยาม', address: '999 ถ.พระราม 1 กรุงเทพฯ', phone: '02-222-2222', is_active: true, created_at: '2025-01-15T00:00:00Z', updated_at: '2025-01-15T00:00:00Z' },
  { id: 'b3', name: 'สาขาอนุสาวรีย์', address: '456 ถ.พหลโยธิน กรุงเทพฯ', phone: '02-333-3333', is_active: false, created_at: '2025-02-01T00:00:00Z', updated_at: '2025-03-01T00:00:00Z' },
]

export const mockProducts: Product[] = [
  { id: 'p1', branch_id: 'b1', name: 'ข้าวผัดกุ้ง', price: 85, category: 'อาหารจานเดียว', image_url: '', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'p2', branch_id: 'b1', name: 'ผัดกระเพราหมู', price: 65, category: 'อาหารจานเดียว', image_url: '', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'p3', branch_id: 'b1', name: 'ต้มยำกุ้ง', price: 120, category: 'ซุป/ยำ', image_url: '', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'p4', branch_id: 'b1', name: 'ไก่ทอด', price: 75, category: 'ของทอด', image_url: '', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'p5', branch_id: 'b1', name: 'น้ำเปล่า', price: 15, category: 'เครื่องดื่ม', image_url: '', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'p6', branch_id: 'b1', name: 'น้ำอัดลม', price: 25, category: 'เครื่องดื่ม', image_url: '', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'p7', branch_id: 'b1', name: 'ชาเย็น', price: 35, category: 'เครื่องดื่ม', image_url: '', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'p8', branch_id: 'b1', name: 'ส้มตำ', price: 55, category: 'ซุป/ยำ', image_url: '', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'p9', branch_id: 'b1', name: 'ลาบหมู', price: 70, category: 'ซุป/ยำ', image_url: '', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'p10', branch_id: 'b1', name: 'กะเพราไข่ดาว', price: 60, category: 'อาหารจานเดียว', image_url: '', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
]

export const mockStock: StockItem[] = [
  { id: 's1', product_id: 'p1', branch_id: 'b1', quantity: 50, min_level: 10, unit: 'จาน', updated_at: '2025-03-19T10:00:00Z', products: mockProducts[0] },
  { id: 's2', product_id: 'p2', branch_id: 'b1', quantity: 8, min_level: 10, unit: 'จาน', updated_at: '2025-03-19T10:00:00Z', products: mockProducts[1] },
  { id: 's3', product_id: 'p3', branch_id: 'b1', quantity: 30, min_level: 5, unit: 'หม้อ', updated_at: '2025-03-19T10:00:00Z', products: mockProducts[2] },
  { id: 's4', product_id: 'p4', branch_id: 'b1', quantity: 3, min_level: 5, unit: 'ชิ้น', updated_at: '2025-03-19T10:00:00Z', products: mockProducts[3] },
  { id: 's5', product_id: 'p5', branch_id: 'b1', quantity: 100, min_level: 20, unit: 'ขวด', updated_at: '2025-03-19T10:00:00Z', products: mockProducts[4] },
  { id: 's6', product_id: 'p6', branch_id: 'b1', quantity: 48, min_level: 12, unit: 'กระป๋อง', updated_at: '2025-03-19T10:00:00Z', products: mockProducts[5] },
  { id: 's7', product_id: 'p7', branch_id: 'b1', quantity: 25, min_level: 10, unit: 'แก้ว', updated_at: '2025-03-19T10:00:00Z', products: mockProducts[6] },
  { id: 's8', product_id: 'p8', branch_id: 'b1', quantity: 4, min_level: 5, unit: 'จาน', updated_at: '2025-03-19T10:00:00Z', products: mockProducts[7] },
]

export const mockStockLogs: StockLog[] = [
  { id: 'l1', product_id: 'p1', branch_id: 'b1', change: 50, reason: 'รับสินค้าใหม่จากคลัง', user_id: 'dev-user', created_at: '2025-03-19T08:00:00Z', products: { name: 'ข้าวผัดกุ้ง', category: 'อาหารจานเดียว' } },
  { id: 'l2', product_id: 'p2', branch_id: 'b1', change: -2, reason: 'POS Order #abc123', user_id: 'dev-user', created_at: '2025-03-19T09:30:00Z', products: { name: 'ผัดกระเพราหมู', category: 'อาหารจานเดียว' } },
  { id: 'l3', product_id: 'p4', branch_id: 'b1', change: -2, reason: 'POS Order #def456', user_id: 'dev-user', created_at: '2025-03-19T10:15:00Z', products: { name: 'ไก่ทอด', category: 'ของทอด' } },
  { id: 'l4', product_id: 'p5', branch_id: 'b1', change: 100, reason: 'รับสินค้าจากซัพพลายเออร์', user_id: 'dev-user', created_at: '2025-03-18T14:00:00Z', products: { name: 'น้ำเปล่า', category: 'เครื่องดื่ม' } },
  { id: 'l5', product_id: 'p3', branch_id: 'b1', change: -1, reason: 'POS Order #ghi789', user_id: 'dev-user', created_at: '2025-03-19T11:00:00Z', products: { name: 'ต้มยำกุ้ง', category: 'ซุป/ยำ' } },
  { id: 'l6', product_id: 'p8', branch_id: 'b1', change: -1, reason: 'สูญหาย/เสียหาย', user_id: 'dev-user', created_at: '2025-03-19T12:00:00Z', products: { name: 'ส้มตำ', category: 'ซุป/ยำ' } },
]

const now = new Date()

export const mockOrders: Order[] = Array.from({ length: 20 }, (_, i) => {
  const date = new Date(now)
  date.setHours(date.getHours() - i * 2)
  const items = [
    { id: `oi${i}-1`, order_id: `o${i}`, product_id: 'p1', quantity: 1, price: 85, products: { name: 'ข้าวผัดกุ้ง', category: 'อาหารจานเดียว' } },
    { id: `oi${i}-2`, order_id: `o${i}`, product_id: 'p5', quantity: 2, price: 15, products: { name: 'น้ำเปล่า', category: 'เครื่องดื่ม' } },
  ]
  return {
    id: `order-${String(i + 1).padStart(4, '0')}-mock`,
    branch_id: 'b1',
    user_id: 'dev-user',
    total: 115,
    status: 'completed' as const,
    note: i % 5 === 0 ? 'ไม่ใส่ผัก' : '',
    created_at: date.toISOString(),
    order_items: items,
  }
})

export const mockDashboard: DashboardStats = {
  total_revenue: 48750,
  total_orders: 423,
  total_products: mockProducts.length,
  low_stock_count: 3,
  revenue_today: 3250,
  orders_today: 28,
}

// Generate 30 days of chart data
export const mockChartData: SalesChartData[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(now)
  date.setDate(date.getDate() - 29 + i)
  const revenue = 800 + Math.floor(Math.random() * 4000)
  return {
    date: date.toISOString().split('T')[0],
    revenue,
    orders: Math.floor(revenue / 115),
  }
})

export const mockUsers = [
  { id: 'u1', email: 'admin@restaurant.com', created_at: '2025-01-01T00:00:00Z', app_metadata: { role: 'superadmin', branch_id: '' } },
  { id: 'u2', email: 'manager.ladprao@restaurant.com', created_at: '2025-01-10T00:00:00Z', app_metadata: { role: 'branch_admin', branch_id: 'b1' } },
  { id: 'u3', email: 'staff.siam@restaurant.com', created_at: '2025-02-01T00:00:00Z', app_metadata: { role: 'staff', branch_id: 'b2' } },
  { id: 'u4', email: 'staff2.ladprao@restaurant.com', created_at: '2025-03-01T00:00:00Z', app_metadata: { role: 'staff', branch_id: 'b1' } },
]

// Helper: wrap mock data as axios-like response
export function mockResp<T>(data: T) {
  return Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config: {} as any })
}

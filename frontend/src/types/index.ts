export interface Branch {
  id: string
  name: string
  address: string
  phone: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  role: 'superadmin' | 'branch_admin' | 'staff'
  branch_id: string
}

export interface Product {
  id: string
  branch_id: string
  name: string
  price: number
  category: string
  image_url: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StockItem {
  id: string
  product_id: string
  branch_id: string
  quantity: number
  min_level: number
  unit: string
  updated_at: string
  products?: Product
}

export interface StockLog {
  id: string
  product_id: string
  branch_id: string
  change: number
  reason: string
  user_id: string
  created_at: string
  products?: { name: string; category: string }
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  products?: { name: string; category: string }
}

export interface Order {
  id: string
  branch_id: string
  user_id: string
  total: number
  status: 'pending' | 'completed' | 'cancelled'
  note: string
  created_at: string
  order_items?: OrderItem[]
}

export interface DashboardStats {
  total_revenue: number
  total_orders: number
  total_products: number
  low_stock_count: number
  revenue_today: number
  orders_today: number
}

export interface SalesChartData {
  date: string
  revenue: number
  orders: number
}

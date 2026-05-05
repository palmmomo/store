export interface User {
  id: string
  email: string
  role: 'admin' | 'accountant' | 'technician' | 'designer'
}

export interface StockItem {
  id: number
  name: string
  unit: string
  quantity: number
  created_at: string
  updated_at: string
}

export interface StockPurchase {
  id: number
  item_id: number
  quantity: number
  price_per_unit: number
  total_price: number
  supplier: string
  purchased_by: string
  purchased_at: string
  note: string
  stock_items?: { name: string; unit: string }
  users?: { email: string }
  item_name?: string
  item_unit?: string
  purchased_by_email?: string
}

export interface StockWithdrawal {
  id: number
  item_id: number
  quantity: number
  purpose: string
  withdrawn_by: string
  withdrawn_at: string
  stock_items?: { name: string; unit: string }
  users?: { email: string }
  item_name?: string
  item_unit?: string
  withdrawn_by_email?: string
}

export interface Branch {
  id: number
  name: string
  address: string
  phone: string
  tax_id: string
  created_at: string
}

export interface QuotationItem {
  description: string
  quantity: number
  price_per_unit: number
  total: number
}

export interface Quotation {
  id: number
  quotation_no: string
  branch_id: number
  customer_name: string
  customer_address: string
  customer_tax_id: string
  items: QuotationItem[]
  total_amount: number
  total_in_words: string
  status: 'draft' | 'sent' | 'approved'
  created_by: string
  created_at: string
  branches?: { name: string }
}

export interface Job {
  id: number
  title: string
  description: string
  status: string
  payment_status: 'unpaid' | 'deposit' | 'paid'
  price: number
  quotation_id: number | null
  assigned_to: string | null
  created_by: string
  created_at: string
  updated_at: string
}

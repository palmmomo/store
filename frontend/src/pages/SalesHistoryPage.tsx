import { useState, useEffect } from 'react'
import { orderApi, branchApi } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { FileText, Building2, Calendar, Filter, TrendingUp, ShoppingCart } from 'lucide-react'

interface Order {
  id: string
  total: number
  payment: string
  created_at: string
  branch_id?: string
  branches?: { name: string }
  user_email?: string
  items?: { description: string; price: number; quantity: number }[]
}

interface Branch {
  id: string
  name: string
}

export default function SalesHistoryPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin'

  const loadOrders = async () => {
    try {
      setLoading(true)
      const res = await orderApi.getAll(isAdmin ? selectedBranch : user?.branch_id)
      setOrders(res?.data || [])
    } catch (err) {
      console.error('Load orders error:', err)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const loadBranches = async () => {
    if (!isAdmin) return
    try {
      const res = await branchApi.getAll()
      setBranches(res?.data || [])
    } catch (err) {
      console.error('Load branches error:', err)
      setBranches([])
    }
  }

  useEffect(() => {
    loadOrders()
    loadBranches()
  }, [selectedBranch])

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (dateFrom || dateTo) {
      const orderDate = new Date(order?.created_at || '')
      if (dateFrom && orderDate < new Date(dateFrom)) return false
      if (dateTo && orderDate > new Date(dateTo + 'T23:59:59')) return false
    }
    return true
  })

  // Calculate totals
  const totalAmount = filteredOrders.reduce((sum, order) => sum + (order?.total || 0), 0)
  const totalTransactions = filteredOrders.length

  // Format date to Buddhist Era
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear() + 543
    return `${day}/${month}/${year}`
  }

  // Format amount
  const formatAmount = (amount: number) => {
    const num = parseFloat(String(amount)) || 0
    return num.toLocaleString('th-TH')
  }

  // Get branch name
  const getBranchName = (order: Order) => {
    return order?.branches?.name || order?.branch_id?.slice(0, 8) || '-'
  }

  // Get user email
  const getUserEmail = (order: Order) => {
    return order?.user_email || '-'
  }

  // Get items description
  const getItemsDescription = (order: Order) => {
    if (!order?.items || order.items.length === 0) return '-'
    if (order.items.length === 1) return order.items[0].description || 'รายการงาน'
    return `${order.items[0].description || 'รายการงาน'} และอีก ${order.items.length - 1} รายการ`
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">
            <ShoppingCart size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            ประวัติยอดขาย
          </h1>
          <p className="page-subtitle">ดูประวัติรายการขายและยอดรายรับ</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ background: 'var(--success-bg)', border: '1px solid var(--success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 48, 
              height: 48, 
              background: 'var(--success)', 
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>ยอดรวมทั้งหมด</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--success)' }}>
                {formatAmount(totalAmount)} บาท
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ background: 'var(--bg-box)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 48, 
              height: 48, 
              background: 'var(--primary)', 
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <FileText size={24} />
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>จำนวนรายการ</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--primary)' }}>
                {totalTransactions} รายการ
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'end' }}>
          {isAdmin && (
            <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
              <label className="form-label">
                <Building2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                กรองตามสาขา
              </label>
              <select 
                className="form-input" 
                value={selectedBranch} 
                onChange={e => setSelectedBranch(e.target.value)}
              >
                <option value="">-- ทุกสาขา --</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
            <label className="form-label">
              <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              ตั้งแต่วันที่
            </label>
            <input 
              type="date" 
              className="form-input" 
              value={dateFrom} 
              onChange={e => setDateFrom(e.target.value)} 
            />
          </div>
          
          <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
            <label className="form-label">
              <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              ถึงวันที่
            </label>
            <input 
              type="date" 
              className="form-input" 
              value={dateTo} 
              onChange={e => setDateTo(e.target.value)} 
            />
          </div>
          
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              setSelectedBranch('')
              setDateFrom('')
              setDateTo('')
            }}
            style={{ height: 40 }}
          >
            <Filter size={14} /> ล้างตัวกรอง
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>วันที่</th>
                {isAdmin && <th>สาขา</th>}
                <th>รายการ</th>
                <th>ช่องทางชำระ</th>
                <th style={{ textAlign: 'right' }}>ยอดขาย</th>
                <th>บันทึกโดย</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: 40 }}>
                    <p style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p>
                  </td>
                </tr>
              ) : filteredOrders?.length > 0 ? (
                filteredOrders.map(order => (
                  <tr key={order?.id}>
                    <td style={{ fontSize: 13 }}>{formatDate(order?.created_at)}</td>
                    {isAdmin && (
                      <td>
                        <span className="badge badge-secondary" style={{ fontSize: 12 }}>
                          {getBranchName(order)}
                        </span>
                      </td>
                    )}
                    <td style={{ fontWeight: 500 }}>{getItemsDescription(order)}</td>
                    <td>
                      <span className={`badge badge-${order?.payment === 'เงินสด' ? 'success' : 'info'}`} style={{ fontSize: 12 }}>
                        {order?.payment || '-'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>
                      {formatAmount(order?.total)} บาท
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {getUserEmail(order)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 60 }}>
                    <ShoppingCart size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                    <div style={{ fontSize: 16, marginBottom: 8 }}>ยังไม่มีประวัติยอดขาย</div>
                    <div style={{ fontSize: 13 }}>ข้อมูลจะปรากฏเมื่อมีการบันทึกรายการขาย</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

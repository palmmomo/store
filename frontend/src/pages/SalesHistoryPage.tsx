import { useState, useEffect } from 'react'
import { orderApi, branchApi } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { FileText, Building2, Calendar, Filter, TrendingUp, ShoppingCart, Pencil, Trash2, X } from 'lucide-react'

interface Order {
  id: string
  total: number
  payment: string
  note?: string
  created_at: string
  branch_id?: string
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
  const [editModal, setEditModal] = useState<Order | null>(null)
  const [editNote, setEditNote] = useState('')
  const [editTotal, setEditTotal] = useState<string>('')
  const [editPayment, setEditPayment] = useState('โอนเงิน')
  const [saving, setSaving] = useState(false)

  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin'

  const loadOrders = async () => {
    try {
      setLoading(true)
      const branchParam = isAdmin ? selectedBranch : user?.branch_id
      const res = await orderApi.getAll(branchParam || undefined)
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
      setBranches([])
    }
  }

  useEffect(() => {
    loadOrders()
    loadBranches()
  }, [selectedBranch])

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันลบรายการนี้?')) return
    try {
      await orderApi.delete(id)
      toast.success('ลบรายการสำเร็จ')
      loadOrders()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'ไม่สามารถลบได้')
    }
  }

  const openEdit = (order: Order) => {
    setEditModal(order)
    const noteDisplay = parseNoteDisplay(order.note)
    setEditNote(noteDisplay)
    setEditTotal(String(order.total))
    setEditPayment(order.payment || parsePaymentFromNote(order.note))
  }

  const handleUpdate = async () => {
    if (!editModal) return
    setSaving(true)
    try {
      await orderApi.update(editModal.id, {
        payment: editPayment,
        total: parseFloat(editTotal) || 0,
        note: editNote,
        items: [{ description: editNote, width: 0, height: 0, price: parseFloat(editTotal) || 0, quantity: 1 }]
      })
      toast.success('แก้ไขสำเร็จ')
      setEditModal(null)
      loadOrders()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (dateFrom || dateTo) {
      const orderDate = new Date(order?.created_at || '')
      if (dateFrom && orderDate < new Date(dateFrom)) return false
      if (dateTo && orderDate > new Date(dateTo + 'T23:59:59')) return false
    }
    return true
  })

  const totalAmount = filteredOrders.reduce((sum, order) => sum + (order?.total || 0), 0)
  const totalTransactions = filteredOrders.length

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear() + 543
    const h = date.getHours().toString().padStart(2, '0')
    const m = date.getMinutes().toString().padStart(2, '0')
    return `${day}/${month}/${year} ${h}:${m}`
  }

  const formatAmount = (amount: number) => {
    const num = parseFloat(String(amount)) || 0
    return num.toLocaleString('th-TH')
  }

  const parseNoteDisplay = (note?: string): string => {
    if (!note) return '-'
    let display = note.replace(/^ชำระ:\s*[^\|]+\|\s*/, '')
    return display.split('|')[0].trim() || note
  }

  const parsePaymentFromNote = (note?: string): string => {
    if (!note) return 'โอนเงิน'
    const match = note.match(/^ชำระ:\s*([^\|]+)/)
    return match ? match[1].trim() : 'โอนเงิน'
  }

  const getBranchName = (order: Order) => {
    const branch = branches.find(b => b.id === order.branch_id)
    return branch?.name || order?.branch_id?.slice(0, 8) || '-'
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
            <div style={{ width: 48, height: 48, background: 'var(--success)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>ยอดรวมทั้งหมด</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--success)' }}>{formatAmount(totalAmount)} บาท</div>
            </div>
          </div>
        </div>
        <div className="card" style={{ background: 'var(--bg-box)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, background: 'var(--primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <FileText size={24} />
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>จำนวนรายการ</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--primary)' }}>{totalTransactions} รายการ</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'end' }}>
          {isAdmin && (
            <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
              <label className="form-label"><Building2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />กรองตามสาขา</label>
              <select className="form-input" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
                <option value="">-- ทุกสาขา --</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
            <label className="form-label"><Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />ตั้งแต่วันที่</label>
            <input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
            <label className="form-label"><Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />ถึงวันที่</label>
            <input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <button className="btn btn-secondary" onClick={() => { setSelectedBranch(''); setDateFrom(''); setDateTo('') }} style={{ height: 40 }}>
            <Filter size={14} /> ล้างตัวกรอง
          </button>
        </div>
      </div>

      {/* Table */}
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
                <th style={{ textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: 40 }}><p style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p></td></tr>
              ) : filteredOrders?.length > 0 ? (
                filteredOrders.map(order => {
                  const payment = order.payment || parsePaymentFromNote(order.note)
                  return (
                    <tr key={order?.id}>
                      <td style={{ fontSize: 12 }}>{formatDate(order?.created_at)}</td>
                      {isAdmin && (
                        <td><span className="badge badge-secondary" style={{ fontSize: 12 }}>{getBranchName(order)}</span></td>
                      )}
                      <td style={{ fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {parseNoteDisplay(order?.note)}
                      </td>
                      <td>
                        <span className={`badge badge-${payment === 'เงินสด' ? 'success' : 'info'}`} style={{ fontSize: 12 }}>
                          {payment}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>
                        {formatAmount(order?.total)} บาท
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-icon" onClick={() => openEdit(order)} title="แก้ไข">
                          <Pencil size={14} />
                        </button>
                        <button className="btn-icon delete" onClick={() => handleDelete(order?.id)} title="ลบ" style={{ marginLeft: 4 }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })
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

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>แก้ไขรายการขาย</h2>
              <button className="btn-icon" onClick={() => setEditModal(null)}><X size={18} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">รายละเอียดงาน</label>
              <input className="form-input" value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="รายละเอียด" />
            </div>
            <div className="form-group">
              <label className="form-label">ยอดรวม (บาท)</label>
              <input type="number" min="0" step="0.01" className="form-input" value={editTotal} onChange={e => setEditTotal(e.target.value)} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">ช่องทางชำระเงิน</label>
              <select className="form-input" value={editPayment} onChange={e => setEditPayment(e.target.value)}>
                <option value="โอนเงิน">โอนเงิน (QR Code)</option>
                <option value="เงินสด">เงินสด</option>
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditModal(null)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleUpdate} disabled={saving}>
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

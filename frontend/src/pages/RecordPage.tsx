import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { orderApi } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Receipt, Trash2, Pencil, X, ShoppingCart, Calendar } from 'lucide-react'

interface JobItem {
  id?: number
  description: string
  width: number
  height: number
  price: number
  quantity: number
}

interface Order {
  id: string
  total: number
  payment: string
  note?: string
  created_at: string
  branch_id?: string
}

export default function RecordPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<JobItem[]>([])
  const [desc, setDesc] = useState('')
  const [price, setPrice] = useState<string>('')
  const [paymentType, setPaymentType] = useState('โอนเงิน')
  const [saving, setSaving] = useState(false)

  // History
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)

  const total = items.reduce((sum, item) => sum + item.price, 0)

  const loadOrders = async () => {
    try {
      setLoading(true)
      const res = await orderApi.getAll(user?.branch_id)
      const data = res?.data || []
      // Sort by created_at desc
      const sorted = Array.isArray(data)
        ? [...data].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        : []
      setOrders(sorted)
    } catch (err) {
      console.error('Load orders error:', err)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!desc || !price) return
    const p = Math.max(0, parseFloat(price) || 0)
    if (p <= 0) {
      toast.error('กรุณากรอกราคา')
      return
    }
    setItems([...items, { description: desc, width: 0, height: 0, price: p, quantity: 1 }])
    setDesc('')
    setPrice('')
  }

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    if (items.length === 0) {
      toast.error('กรุณาเพิ่มรายการงาน')
      return
    }
    setSaving(true)
    try {
      await orderApi.create({
        payment: paymentType,
        total,
        items: items.map(i => ({
          description: i.description,
          width: 0,
          height: 0,
          price: i.price,
          quantity: 1,
        }))
      })
      toast.success('บันทึกรายการสำเร็จ!')
      setItems([])
      setPaymentType('โอนเงิน')
      loadOrders()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      toast.error(error?.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('ยืนยันที่จะลบรายการนี้?')) return
    try {
      await orderApi.delete(id)
      toast.success('ลบรายการสำเร็จ')
      loadOrders()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'ไม่สามารถลบรายการได้')
    }
  }

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order)
    // Parse items from note field
    const noteItems = parseNoteToItems(order.note || '')
    setItems(noteItems.length > 0 ? noteItems : [{ description: order.note || 'รายการงาน', width: 0, height: 0, price: order.total, quantity: 1 }])
    setPaymentType(order.payment || 'โอนเงิน')
  }

  const handleUpdateOrder = async () => {
    if (!editingOrder || items.length === 0) {
      toast.error('กรุณาเพิ่มรายการงาน')
      return
    }
    setSaving(true)
    try {
      await orderApi.update(editingOrder.id, {
        payment: paymentType,
        total,
        items: items.map(i => ({
          description: i.description,
          width: 0,
          height: 0,
          price: i.price,
          quantity: 1,
        }))
      })
      toast.success('อัปเดตรายการสำเร็จ!')
      setItems([])
      setEditingOrder(null)
      setPaymentType('โอนเงิน')
      loadOrders()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      toast.error(error?.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

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

  // Parse note field to display description — note format: "ชำระ: โอนเงิน | itemA | itemB"
  const parseNoteDisplay = (note?: string): string => {
    if (!note) return '-'
    // Remove payment prefix if present
    let display = note.replace(/^ชำระ:\s*[^\|]+\|\s*/, '')
    // Trim and show first item
    display = display.split('|')[0].trim()
    return display || note
  }

  const parsePaymentFromNote = (order: Order): string => {
    if (order.payment) return order.payment
    if (!order.note) return '-'
    const match = order.note.match(/^ชำระ:\s*([^\|]+)/)
    return match ? match[1].trim() : '-'
  }

  const parseNoteToItems = (note: string): JobItem[] => {
    // Remove payment prefix
    const cleaned = note.replace(/^ชำระ:\s*[^\|]+\|\s*/, '')
    const parts = cleaned.split('|').map(s => s.trim()).filter(Boolean)
    return parts.map(desc => ({
      description: desc,
      width: 0,
      height: 0,
      price: 0,
      quantity: 1,
    }))
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ShoppingCart size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            {editingOrder ? 'แก้ไขรายการงาน' : 'บันทึกรายการงาน'}
          </h1>
          <p className="page-subtitle">
            {editingOrder ? `แก้ไขรายการ #${editingOrder.id.slice(0, 8)}` : 'เพิ่มรายการสั่งพิมพ์อิงค์เจ็ท / รับเงิน'}
          </p>
        </div>
        {editingOrder && (
          <button className="btn btn-secondary" onClick={() => {
            setEditingOrder(null)
            setItems([])
            setPaymentType('โอนเงิน')
          }}>
            <X size={16} /> ยกเลิกการแก้ไข
          </button>
        )}
      </div>

      <div className="record-layout">

        {/* Form Section */}
        <div className="card">
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label className="form-label">ชื่องาน / รายละเอียด</label>
              <input
                className="form-input"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="เช่น ไวนิลโปรโมชั่นหน้าร้าน"
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">ราคา (บาท)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <Plus size={16} /> เพิ่มรายการ
            </button>
          </form>
        </div>

        {/* Bill Summary Section */}
        <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px dashed var(--border)', paddingBottom: 12 }}>
            <Receipt size={20} color="var(--primary)" />
            <h3 style={{ fontSize: 16, margin: 0 }}>{editingOrder ? 'รายการที่แก้ไข' : 'บิลรายการ'}</h3>
          </div>

          <div style={{ minHeight: 120 }}>
            {items.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 36 }}>ยังไม่มีรายการ</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{item.description}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600 }}>{item.price.toLocaleString('th-TH')}฿</span>
                      <button className="btn-icon delete" onClick={() => removeItem(idx)} title="ลบ">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ borderTop: '1px dashed var(--border)', marginTop: 16, paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <strong style={{ fontSize: 15 }}>ยอดรวมทั้งสิ้น</strong>
              <strong style={{ fontSize: 18, color: 'var(--primary)' }}>{total.toLocaleString('th-TH')} บาท</strong>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12 }}>ช่องทางชำระเงิน</label>
              <select className="form-input" value={paymentType} onChange={e => setPaymentType(e.target.value)}>
                <option value="โอนเงิน">โอนเงิน (QR Code)</option>
                <option value="เงินสด">เงินสด</option>
              </select>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px 0', fontSize: 14 }}
              onClick={editingOrder ? handleUpdateOrder : handleSave}
              disabled={items.length === 0 || saving}
            >
              <ShoppingCart size={16} /> {saving ? 'กำลังบันทึก...' : editingOrder ? 'บันทึกการแก้ไข' : 'บันทึก'}
            </button>
          </div>
        </div>

      </div>

      {/* Sales History */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={18} />
          ประวัติรายการขาย
        </h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>วันที่</th>
                <th>รายการ</th>
                <th>ช่องทาง</th>
                <th style={{ textAlign: 'right' }}>ยอดขาย</th>
                <th style={{ textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 40 }}>
                    <p style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p>
                  </td>
                </tr>
              ) : orders?.length > 0 ? (
                orders.slice(0, 20).map(order => (
                  <tr key={order?.id}>
                    <td style={{ fontSize: 12 }}>{formatDate(order?.created_at)}</td>
                    <td style={{ fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {parseNoteDisplay(order?.note)}
                    </td>
                    <td>
                      <span className={`badge badge-${parsePaymentFromNote(order) === 'เงินสด' ? 'success' : 'info'}`} style={{ fontSize: 11 }}>
                        {parsePaymentFromNote(order)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>
                      {order?.total?.toLocaleString('th-TH')} บาท
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-icon" onClick={() => handleEditOrder(order)} title="แก้ไข">
                        <Pencil size={14} />
                      </button>
                      <button className="btn-icon delete" onClick={() => handleDeleteOrder(order?.id)} title="ลบ" style={{ marginLeft: 4 }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                    ยังไม่มีประวัติรายการขาย
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

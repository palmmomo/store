import { useState } from 'react'
import { toast } from 'react-hot-toast'
import api from '../api/client'
import { Plus, Receipt, Printer, Trash2 } from 'lucide-react'

interface JobItem {
  description: string
  width: number
  height: number
  price: number
}

export default function RecordPage() {
  const [items, setItems] = useState<JobItem[]>([])
  const [desc, setDesc] = useState('')
  const [width, setWidth] = useState<string>('')
  const [height, setHeight] = useState<string>('')
  const [price, setPrice] = useState<string>('')
  const [paymentType, setPaymentType] = useState('โอนเงิน')
  const [saving, setSaving] = useState(false)

  const total = items.reduce((sum, item) => sum + item.price, 0)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!desc || !price) return
    const w = Math.max(0, parseFloat(width) || 0)
    const h = Math.max(0, parseFloat(height) || 0)
    const p = Math.max(0, parseFloat(price) || 0)
    if (p <= 0) {
      toast.error('กรุณากรอกราคา')
      return
    }
    setItems([...items, { description: desc, width: w, height: h, price: p }])
    setDesc('')
    setWidth('')
    setHeight('')
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
      await api.post('/orders', {
        payment: paymentType,
        total,
        items: items.map(i => ({
          description: i.description,
          width: i.width,
          height: i.height,
          price: i.price,
          quantity: 1,
        }))
      })
      toast.success('บันทึกรายการสำเร็จ!')
      setItems([])
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      const msg = error?.response?.data?.error || 'เกิดข้อผิดพลาด'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">บันทึกรายการงาน</h1>
          <p className="page-subtitle">เพิ่มรายการสั่งพิมพ์อิงค์เจ็ท / รับเงิน</p>
        </div>
      </div>

      <div className="record-layout">
        
        {/* Form Section */}
        <div className="card">
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label className="form-label">ชื่องาน / รายละเอียด</label>
              <input className="form-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="เช่น ไวนิลโปรโมชั่นหน้าร้าน" autoFocus required />
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">ความกว้าง (เมตร)</label>
                <input type="number" step="0.01" min="0" className="form-input" value={width} onChange={e => setWidth(e.target.value)} placeholder="0.00" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">ความยาว (เมตร)</label>
                <input type="number" step="0.01" min="0" className="form-input" value={height} onChange={e => setHeight(e.target.value)} placeholder="0.00" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">ราคา (บาท)</label>
              <input type="number" min="0" step="0.01" className="form-input" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" required />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <Plus size={16} /> หยิบใส่บิล
            </button>
          </form>
        </div>

        {/* Bill Summary Section */}
        <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px dashed var(--border)', paddingBottom: 12 }}>
            <Receipt size={20} color="var(--primary)" />
            <h3 style={{ fontSize: 16, margin: 0 }}>บิลรายการ</h3>
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
                      {(item.width > 0 && item.height > 0) && (
                        <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{item.width} x {item.height} m</div>
                      )}
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
              onClick={handleSave}
              disabled={items.length === 0 || saving}
            >
              <Printer size={16} /> {saving ? 'กำลังบันทึก...' : 'บันทึกและพิมพ์บิล'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

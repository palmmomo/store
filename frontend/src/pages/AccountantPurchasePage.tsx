import { useState, useEffect } from 'react'
import { stockApi, purchaseApi } from '../api/client'
import type { StockItem, StockPurchase } from '../types'
import { ShoppingCart, Save, RotateCcw, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AccountantPurchasePage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [recentPurchases, setRecentPurchases] = useState<StockPurchase[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', unit: '' })

  const [form, setForm] = useState({
    item_id: '',
    quantity: '',
    price_per_unit: '',
    total_price: '',
    supplier: '',
    note: '',
  })

  const fetchData = async () => {
    try {
      const [stockRes, purchaseRes] = await Promise.all([
        stockApi.getAll(),
        purchaseApi.getAll(),
      ])
      setItems(stockRes.data || [])
      setRecentPurchases((purchaseRes.data || []).slice(0, 10))
    } catch {
      toast.error('โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Auto-calculate
  const qty = parseFloat(form.quantity) || 0
  const ppu = parseFloat(form.price_per_unit) || 0
  const total = parseFloat(form.total_price) || 0
  const calculatedTotal = ppu > 0 && qty > 0 ? ppu * qty : total
  const calculatedPPU = total > 0 && qty > 0 && ppu === 0 ? total / qty : ppu

  const resetForm = () => {
    setForm({ item_id: '', quantity: '', price_per_unit: '', total_price: '', supplier: '', note: '' })
  }

  const handleSave = async () => {
    if (!form.item_id) { toast.error('กรุณาเลือกสินค้า'); return }
    if (qty <= 0) { toast.error('กรุณากรอกจำนวนที่ซื้อ'); return }

    setSaving(true)
    try {
      await purchaseApi.create({
        item_id: parseInt(form.item_id),
        quantity: qty,
        price_per_unit: calculatedPPU,
        total_price: calculatedTotal,
        supplier: form.supplier,
        note: form.note,
      })
      toast.success('บันทึกการซื้อสำเร็จ — สต็อกเพิ่มอัตโนมัติ')
      resetForm()
      fetchData()
    } catch {
      toast.error('บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const selectedItem = items.find(i => i.id === parseInt(form.item_id))

  const formatDate = (d: string) => {
    const date = new Date(d)
    return date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }) +
      ' ' + date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 60 }}>กำลังโหลด...</p>
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCart size={22} /> ซื้อของเข้าสต็อก
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            กรอกข้อมูลการจัดซื้อวัสดุ — สต็อกจะเพิ่มอัตโนมัติ
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Purchase Form */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>รายละเอียดการซื้อ</h3>

          <div className="form-group">
            <label className="form-label">เลือกสินค้า *</label>
            <select
              id="purchase-item"
              className="form-input"
              value={form.item_id}
              onChange={e => setForm({ ...form, item_id: e.target.value })}
            >
              <option value="">-- เลือกสินค้า --</option>
              {items.map(i => (
                <option key={i.id} value={i.id}>
                  {i.name} (คงเหลือ: {i.quantity} {i.unit})
                </option>
              ))}
            </select>
            <button className="btn" onClick={() => setShowAddItem(true)} style={{ marginTop: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={14} /> เพิ่มสินค้าใหม่
            </button>
          </div>

          {selectedItem && (
            <div style={{
              background: '#f0f9ff', padding: '8px 12px', borderRadius: 8,
              fontSize: 12, color: '#0369a1', marginBottom: 12,
            }}>
              สต็อกปัจจุบัน: <strong>{selectedItem.quantity} {selectedItem.unit}</strong>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">จำนวนที่ซื้อ *</label>
            <input
              id="purchase-qty"
              className="form-input"
              type="number"
              min="0.01"
              step="0.01"
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })}
              placeholder="0"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">ราคาต่อหน่วย</label>
              <input
                id="purchase-ppu"
                className="form-input"
                type="number"
                min="0"
                step="0.01"
                value={form.price_per_unit}
                onChange={e => setForm({ ...form, price_per_unit: e.target.value, total_price: '' })}
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label className="form-label">ราคารวมทั้งล็อต</label>
              <input
                id="purchase-total"
                className="form-input"
                type="number"
                min="0"
                step="0.01"
                value={form.total_price}
                onChange={e => setForm({ ...form, total_price: e.target.value, price_per_unit: '' })}
                placeholder="0.00"
              />
            </div>
          </div>

          {calculatedTotal > 0 && (
            <div style={{
              background: '#f0fdf4', padding: '8px 12px', borderRadius: 8,
              fontSize: 13, color: '#166534', marginBottom: 12, fontWeight: 500,
            }}>
              ราคารวม: ฿{calculatedTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              {calculatedPPU > 0 && ` (หน่วยละ ฿${calculatedPPU.toLocaleString('th-TH', { minimumFractionDigits: 2 })})`}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">ร้านที่ซื้อ</label>
            <input
              id="purchase-supplier"
              className="form-input"
              value={form.supplier}
              onChange={e => setForm({ ...form, supplier: e.target.value })}
              placeholder="ชื่อร้าน / ร้านค้า"
            />
          </div>

          <div className="form-group">
            <label className="form-label">หมายเหตุ</label>
            <input
              className="form-input"
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
              placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn" onClick={resetForm} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RotateCcw size={14} /> ล้าง
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              id="save-purchase-btn"
              style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}
            >
              <Save size={14} /> {saving ? 'กำลังบันทึก...' : 'บันทึกการซื้อ'}
            </button>
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>การซื้อล่าสุด</h3>
          {recentPurchases.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 30 }}>
              ยังไม่มีประวัติการซื้อ
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentPurchases.map(p => (
                <div key={p.id} style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: '#f8fafc', border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>
                      {p.stock_items?.name || 'N/A'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {formatDate(p.purchased_at)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {p.quantity} {p.stock_items?.unit || ''} × ฿{p.price_per_unit.toLocaleString()} = <strong style={{ color: 'var(--success)' }}>฿{p.total_price.toLocaleString()}</strong>
                    {p.supplier && <span> · {p.supplier}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Add stock item modal */}
      {showAddItem && (
        <div className="modal-overlay" onClick={() => setShowAddItem(false)}><div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
          <h3 style={{ marginBottom: 16 }}>เพิ่มสินค้าใหม่</h3>
          <div className="form-group"><label className="form-label">ชื่อสินค้า *</label><input className="form-input" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="เช่น หมึก Outdoor" autoFocus /></div>
          <div className="form-group"><label className="form-label">หน่วย *</label><input className="form-input" value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} placeholder="เช่น แกลลอน, ม้วน" /></div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn" onClick={() => setShowAddItem(false)}>ยกเลิก</button>
            <button className="btn btn-primary" onClick={async () => {
              if (!newItem.name.trim() || !newItem.unit.trim()) { toast.error('กรอกชื่อและหน่วย'); return }
              try {
                const res = await stockApi.create({ name: newItem.name, unit: newItem.unit, quantity: 0 })
                toast.success('เพิ่มสินค้าสำเร็จ')
                setShowAddItem(false)
                setNewItem({ name: '', unit: '' })
                await fetchData()
                if (res.data?.id) setForm(f => ({ ...f, item_id: String(res.data.id) }))
              } catch { toast.error('เพิ่มไม่สำเร็จ') }
            }}>เพิ่มสินค้า</button>
          </div>
        </div></div>
      )}
    </div>
  )
}

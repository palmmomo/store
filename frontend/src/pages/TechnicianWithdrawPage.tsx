import { useState, useEffect } from 'react'
import { stockApi, withdrawalApi } from '../api/client'
import type { StockItem, StockWithdrawal } from '../types'
import { PackageMinus, Save, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TechnicianWithdrawPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [recentWithdrawals, setRecentWithdrawals] = useState<StockWithdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    item_id: '',
    quantity: '',
    purpose: '',
  })

  const fetchData = async () => {
    try {
      const [stockRes, withdrawalRes] = await Promise.all([
        stockApi.getAll(),
        withdrawalApi.getAll(),
      ])
      setItems(stockRes.data || [])
      setRecentWithdrawals((withdrawalRes.data || []).slice(0, 10))
    } catch {
      toast.error('โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const selectedItem = items.find(i => i.id === parseInt(form.item_id))
  const qty = parseFloat(form.quantity) || 0

  const resetForm = () => {
    setForm({ item_id: '', quantity: '', purpose: '' })
  }

  const handleSave = async () => {
    if (!form.item_id) { toast.error('กรุณาเลือกสินค้า'); return }
    if (qty <= 0) { toast.error('กรุณากรอกจำนวนที่เบิก'); return }

    if (selectedItem && qty > selectedItem.quantity) {
      toast.error(`สต็อกไม่พอ! ${selectedItem.name} คงเหลือ ${selectedItem.quantity} ${selectedItem.unit}`)
      return
    }

    setSaving(true)
    try {
      await withdrawalApi.create({
        item_id: parseInt(form.item_id),
        quantity: qty,
        purpose: form.purpose,
      })
      toast.success('บันทึกการเบิกสำเร็จ — สต็อกลดอัตโนมัติ')
      resetForm()
      fetchData()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'บันทึกไม่สำเร็จ'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

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
            <PackageMinus size={22} /> เบิกของออก
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            กรอกรายละเอียดการเบิกวัสดุ — สต็อกจะลดอัตโนมัติ
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Withdraw Form */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>รายละเอียดการเบิก</h3>

          <div className="form-group">
            <label className="form-label">เลือกสินค้า *</label>
            <select
              id="withdraw-item"
              className="form-input"
              value={form.item_id}
              onChange={e => setForm({ ...form, item_id: e.target.value })}
            >
              <option value="">-- เลือกสินค้า --</option>
              {items.map(i => (
                <option key={i.id} value={i.id} disabled={i.quantity <= 0}>
                  {i.name} (คงเหลือ: {i.quantity} {i.unit}){i.quantity <= 0 ? ' — หมด' : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedItem && (
            <div style={{
              background: selectedItem.quantity <= 5 ? '#fef2f2' : '#f0f9ff',
              padding: '8px 12px', borderRadius: 8,
              fontSize: 12,
              color: selectedItem.quantity <= 5 ? '#991b1b' : '#0369a1',
              marginBottom: 12,
            }}>
              สต็อกปัจจุบัน: <strong>{selectedItem.quantity} {selectedItem.unit}</strong>
              {selectedItem.quantity <= 5 && ' ⚠️ ใกล้หมด'}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">จำนวนที่เบิก *</label>
            <input
              id="withdraw-qty"
              className="form-input"
              type="number"
              min="0.01"
              step="0.01"
              max={selectedItem?.quantity}
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })}
              placeholder="0"
            />
            {selectedItem && qty > selectedItem.quantity && (
              <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>
                จำนวนเกินสต็อก (คงเหลือ {selectedItem.quantity} {selectedItem.unit})
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">เบิกไปทำอะไร</label>
            <textarea
              id="withdraw-purpose"
              className="form-input"
              value={form.purpose}
              onChange={e => setForm({ ...form, purpose: e.target.value })}
              placeholder="เช่น พิมพ์ป้ายร้าน ABC, ซ่อมแซมป้ายเดิม..."
              rows={3}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn" onClick={resetForm} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RotateCcw size={14} /> ล้าง
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || (selectedItem ? qty > selectedItem.quantity : false)}
              id="save-withdraw-btn"
              style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}
            >
              <Save size={14} /> {saving ? 'กำลังบันทึก...' : 'บันทึกการเบิก'}
            </button>
          </div>
        </div>

        {/* Recent Withdrawals */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>การเบิกล่าสุด</h3>
          {recentWithdrawals.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 30 }}>
              ยังไม่มีประวัติการเบิก
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentWithdrawals.map(w => (
                <div key={w.id} style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: '#f8fafc', border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>
                      {w.stock_items?.name || 'N/A'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {formatDate(w.withdrawn_at)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--danger)', fontWeight: 600 }}>-{w.quantity} {w.stock_items?.unit || ''}</span>
                    {w.purpose && <span> · {w.purpose}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

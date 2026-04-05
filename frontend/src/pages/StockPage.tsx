import { useState, useEffect } from 'react'
import { stockApi } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import {
  Plus, Pencil, Trash2, ArrowUpRight, ArrowDownLeft, AlertTriangle, Package, X,
} from 'lucide-react'

interface Material {
  id: number
  branch_id: string
  name: string
  category_id: number
  unit: string
  current_stock: number
  min_stock_level: number
  created_at: string
  updated_at: string
}

export default function StockPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Material | null>(null)
  const [showAdjust, setShowAdjust] = useState<Material | null>(null)
  const [form, setForm] = useState({ name: '', category_id: 1, unit: 'ชิ้น', min_stock_level: 0 })
  const [adjustForm, setAdjustForm] = useState({ type: 'add' as 'add' | 'deduct', quantity: 0, reason: '' })

  const loadStock = async () => {
    try {
      const res = await stockApi.getAll(user?.branch_id || undefined)
      const data = res.data?.data || res.data || []
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Load stock error:', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStock() }, [])

  const handleCreate = async () => {
    if (!form.name) return
    try {
      await stockApi.create(form)
      toast.success('เพิ่มวัสดุสำเร็จ')
      setShowForm(false)
      setForm({ name: '', category_id: 1, unit: 'ชิ้น', min_stock_level: 0 })
      loadStock()
    } catch (err) {
      toast.error('ไม่สามารถเพิ่มวัสดุได้')
      console.error(err)
    }
  }

  const handleUpdate = async () => {
    if (!editingItem || !form.name) return
    try {
      await stockApi.update(editingItem.id, form)
      toast.success('แก้ไขวัสดุสำเร็จ')
      setEditingItem(null)
      setShowForm(false)
      loadStock()
    } catch (err) {
      toast.error('ไม่สามารถแก้ไขได้')
      console.error(err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('ยืนยันลบวัสดุนี้?')) return
    try {
      await stockApi.delete(id)
      toast.success('ลบวัสดุสำเร็จ')
      loadStock()
    } catch (err) {
      toast.error('ไม่สามารถลบได้')
      console.error(err)
    }
  }

  const handleAdjust = async () => {
    if (!showAdjust || adjustForm.quantity <= 0) return
    try {
      if (adjustForm.type === 'add') {
        await stockApi.purchase({
          material_id: showAdjust.id,
          supplier_id: 1,
          quantity: adjustForm.quantity,
          total_price: 0,
        })
      } else {
        await stockApi.deduct({
          material_id: showAdjust.id,
          quantity: adjustForm.quantity,
          notes: adjustForm.reason,
        })
      }
      toast.success(adjustForm.type === 'add' ? 'เติมสต็อกสำเร็จ' : 'เบิกใช้สำเร็จ')
      setShowAdjust(null)
      setAdjustForm({ type: 'add', quantity: 0, reason: '' })
      loadStock()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'เกิดข้อผิดพลาด'
      toast.error(msg)
    }
  }

  const openCreate = () => {
    setEditingItem(null)
    setForm({ name: '', category_id: 1, unit: 'ชิ้น', min_stock_level: 0 })
    setShowForm(true)
  }

  const openEdit = (item: Material) => {
    setEditingItem(item)
    setForm({ name: item.name, category_id: item.category_id, unit: item.unit, min_stock_level: item.min_stock_level })
    setShowForm(true)
  }

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: 24 }}>กำลังโหลดสต็อก...</p>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">สต็อกวัสดุ</h1>
          <p className="page-subtitle">
            {user?.role === 'superadmin' ? 'จัดการสต็อกทุกสาขา' : 'สต็อกของสาขาคุณ'}
            {' '}— {items.length} รายการ
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> เพิ่มวัสดุ</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ชื่อวัสดุ</th>
              <th>หน่วย</th>
              <th style={{ textAlign: 'right' }}>คงเหลือ</th>
              <th style={{ textAlign: 'right' }}>ขั้นต่ำ</th>
              <th>สถานะ</th>
              <th style={{ textAlign: 'right' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {items.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.name}</td>
                <td>{s.unit}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: s.current_stock <= s.min_stock_level ? 'var(--danger)' : 'var(--text-primary)' }}>
                  {s.current_stock}
                </td>
                <td style={{ textAlign: 'right' }}>{s.min_stock_level}</td>
                <td>
                  {s.current_stock <= s.min_stock_level
                    ? <span className="badge badge-danger"><AlertTriangle size={11} /> ต่ำ</span>
                    : <span className="badge badge-success">ปกติ</span>
                  }
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <button className="btn-icon" title="เติมสต็อก" onClick={() => { setShowAdjust(s); setAdjustForm({ type: 'add', quantity: 0, reason: '' }) }}>
                      <ArrowUpRight size={13} />
                    </button>
                    <button className="btn-icon" title="เบิกใช้" onClick={() => { setShowAdjust(s); setAdjustForm({ type: 'deduct', quantity: 0, reason: '' }) }}>
                      <ArrowDownLeft size={13} />
                    </button>
                    <button className="btn-icon" title="แก้ไข" onClick={() => openEdit(s)}><Pencil size={13} /></button>
                    <button className="btn-icon delete" title="ลบ" onClick={() => handleDelete(s.id)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                <Package size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><br />ยังไม่มีวัสดุในสต็อก
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Material Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>{editingItem ? 'แก้ไขวัสดุ' : 'เพิ่มวัสดุใหม่'}</h2>
              <button className="btn-icon" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">ชื่อวัสดุ</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="เช่น ไวนิลหลังขาว 3.20m" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">หน่วย</label>
              <select className="form-input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                <option value="ม้วน">ม้วน</option>
                <option value="ชุด">ชุด</option>
                <option value="แผ่น">แผ่น</option>
                <option value="ชิ้น">ชิ้น</option>
                <option value="ตร.ม.">ตร.ม.</option>
                <option value="แกลลอน">แกลลอน</option>
                <option value="ลิตร">ลิตร</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">สต็อกขั้นต่ำ</label>
              <input className="form-input" type="number" value={form.min_stock_level} onChange={e => setForm({ ...form, min_stock_level: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={editingItem ? handleUpdate : handleCreate} disabled={!form.name}>
                {editingItem ? 'บันทึก' : 'เพิ่ม'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjust && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>{adjustForm.type === 'add' ? 'เติมสต็อก' : 'เบิกใช้'}: {showAdjust.name}</h2>
              <button className="btn-icon" onClick={() => setShowAdjust(null)}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              คงเหลือ: <strong>{showAdjust.current_stock} {showAdjust.unit}</strong>
            </p>
            <div className="form-group">
              <label className="form-label">จำนวน ({showAdjust.unit})</label>
              <input className="form-input" type="number" value={adjustForm.quantity || ''} onChange={e => setAdjustForm({ ...adjustForm, quantity: parseFloat(e.target.value) || 0 })} autoFocus />
            </div>
            {adjustForm.type === 'deduct' && (
              <div className="form-group">
                <label className="form-label">เหตุผล/หมายเหตุ</label>
                <input className="form-input" value={adjustForm.reason} onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })} placeholder="เช่น พิมพ์งานลูกค้า" />
              </div>
            )}
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAdjust(null)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleAdjust} disabled={adjustForm.quantity <= 0}>
                {adjustForm.type === 'add' ? 'เติม' : 'เบิก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

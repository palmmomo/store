import { useState, useEffect } from 'react'
import { stockApi, branchApi } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import {
  Plus, Pencil, Trash2, ArrowUpRight, ArrowDownLeft, AlertTriangle, Package, X,
  ShoppingCart, Send, Boxes
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
  const [activeTab, setActiveTab] = useState<'stock' | 'purchase'>('stock')
  const [items, setItems] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Material | null>(null)
  const [showAdjust, setShowAdjust] = useState<Material | null>(null)
  const [adminBranchSelect, setAdminBranchSelect] = useState<string>('')
  const [branches, setBranches] = useState<{id: string, name: string}[]>([])
  const [form, setForm] = useState({ name: '', category_id: 1, unit: 'ชิ้น', initial_stock: 0, min_stock_level: 0 })
  const [adjustForm, setAdjustForm] = useState({ type: 'add' as 'add' | 'deduct', quantity: 0, reason: '' })

  // Purchase Form
  const [purchaseItemName, setPurchaseItemName] = useState('')
  const [purchaseQty, setPurchaseQty] = useState('')
  const [purchaseUnit, setPurchaseUnit] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchaseStore, setPurchaseStore] = useState('')
  const [saving, setSaving] = useState(false)
  
  // Search
  const [searchQuery, setSearchQuery] = useState('')

  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin'
  
  // Filter items based on search
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.unit.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const loadStock = async () => {
    try {
      const branchParam = isAdmin ? adminBranchSelect : user?.branch_id
      const res = await stockApi.getAll(branchParam || undefined)
      const data = res.data?.data || res.data || []
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Load stock error:', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStock() }, [adminBranchSelect])

  useEffect(() => {
    if (isAdmin) {
      branchApi.getAll().then(res => setBranches(res.data || []))
    }
  }, [user])

  const handleCreate = async () => {
    if (!form.name) return
    try {
      await stockApi.create(form)
      toast.success('เพิ่มวัสดุสำเร็จ')
      setShowForm(false)
      setForm({ name: '', category_id: 1, unit: 'ชิ้น', initial_stock: 0, min_stock_level: 0 })
      loadStock()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'ไม่สามารถเพิ่มวัสดุได้')
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
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'ไม่สามารถแก้ไขได้')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('ยืนยันลบวัสดุนี้?')) return
    try {
      await stockApi.delete(id)
      toast.success('ลบวัสดุสำเร็จ')
      loadStock()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'ไม่สามารถลบได้')
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
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'เกิดข้อผิดพลาด')
    }
  }

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!purchaseItemName || !purchaseQty || !purchaseUnit || !purchasePrice) return
    setSaving(true)
    try {
      await stockApi.simplePurchase({
        item_name: purchaseItemName,
        quantity: parseFloat(purchaseQty),
        unit: purchaseUnit,
        price: parseFloat(purchasePrice),
        store_name: purchaseStore
      })
      toast.success('บันทึกสั่งซื้อวัสดุสำเร็จ!')
      setPurchaseItemName('')
      setPurchaseQty('')
      setPurchaseUnit('')
      setPurchasePrice('')
      setPurchaseStore('')
      loadStock()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setSaving(false)
    }
  }

  const openCreate = () => {
    setEditingItem(null)
    setForm({ name: '', category_id: 1, unit: 'ชิ้น', initial_stock: 0, min_stock_level: 0 })
    setShowForm(true)
  }

  const openEdit = (item: Material) => {
    setEditingItem(item)
    setForm({ name: item.name, category_id: item.category_id, unit: item.unit, initial_stock: 0, min_stock_level: item.min_stock_level })
    setShowForm(true)
  }

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: 24 }}>กำลังโหลดสต็อก...</p>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">สต็อกวัสดุ</h1>
          <p className="page-subtitle">
            {isAdmin ? 'จัดการสต็อกทุกสาขา' : 'จัดการสต็อกของสาขาคุณ'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button 
          onClick={() => setActiveTab('stock')}
          style={{ 
            flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
            background: activeTab === 'stock' ? 'var(--primary)' : 'var(--bg-card)',
            color: activeTab === 'stock' ? 'white' : 'var(--text)',
            border: '1px solid', borderColor: activeTab === 'stock' ? 'var(--primary)' : 'var(--border)',
            borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', transition: '0.2s'
          }}
        >
          <Boxes size={18} /> สต็อกวัสดุ
        </button>
        <button 
          onClick={() => setActiveTab('purchase')}
          style={{ 
            flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
            background: activeTab === 'purchase' ? 'var(--primary)' : 'var(--bg-card)',
            color: activeTab === 'purchase' ? 'white' : 'var(--text)',
            border: '1px solid', borderColor: activeTab === 'purchase' ? 'var(--primary)' : 'var(--border)',
            borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', transition: '0.2s'
          }}
        >
          <ShoppingCart size={18} /> สั่งซื้อของเข้าร้าน
        </button>
      </div>

      {activeTab === 'stock' ? (
        <>
          {isAdmin && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ marginRight: 12, fontWeight: 500 }}>เลือกสาขา:</label>
              <select className="form-input" style={{ width: 250, display: 'inline-block' }} value={adminBranchSelect} onChange={e => setAdminBranchSelect(e.target.value)}>
                <option value="">-- ดูสต็อกรวมทุกสาขา --</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Search */}
          <div style={{ marginBottom: 16 }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="🔍 ค้นหาวัสดุ... (พิมพ์ชื่อวัสดุ)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', maxWidth: 400 }}
            />
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
                  {!isAdmin && <th style={{ textAlign: 'right' }}>จัดการ</th>}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((s, idx) => (
                  <tr key={s.id} style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary)' }}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      {s.name}
                      {isAdmin && s.branch_id && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>สาขา ID: {s.branch_id}</div>}
                    </td>
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
                    {!isAdmin && (
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
                    )}
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                    {searchQuery ? (
                      <>
                        <Package size={48} style={{ opacity: 0.3, marginBottom: 12 }} /><br />
                        ไม่พบ "{searchQuery}"
                      </>
                    ) : (
                      <>
                        <Package size={48} style={{ opacity: 0.3, marginBottom: 12 }} /><br />ยังไม่มีวัสดุในสต็อก
                      </>
                    )}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {!isAdmin && (
            <button className="btn btn-primary" onClick={openCreate} style={{ marginTop: 20, width: '100%' }}>
              <Plus size={16} /> เพิ่มวัสดุใหม่
            </button>
          )}
        </>
      ) : (
        <div className="card">
          <form onSubmit={handleSavePurchase}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, color: 'var(--primary)' }}>
              <ShoppingCart size={20} />
              <h2 style={{ fontSize: 16, margin: 0 }}>บันทึกสั่งซื้อวัสดุเข้าร้าน</h2>
            </div>

            <div className="form-group">
              <label className="form-label">ชื่อวัสดุ</label>
              <input 
                className="form-input" 
                value={purchaseItemName} 
                onChange={e => setPurchaseItemName(e.target.value)} 
                placeholder="พิมพ์ชื่อวัสดุ (เช่น ไวนิล, หมึกพิมพ์)"
                required 
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">จำนวน</label>
                <input type="number" min="0" step="0.01" className="form-input" value={purchaseQty} onChange={e => setPurchaseQty(e.target.value)} placeholder="0.00" required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">หน่วย</label>
                <input 
                  className="form-input" 
                  value={purchaseUnit} 
                  onChange={e => setPurchaseUnit(e.target.value)} 
                  placeholder="เช่น ม้วน, แผ่น, ลิตร"
                  list="unit-suggestions"
                  required 
                />
                <datalist id="unit-suggestions">
                  <option value="ม้วน" />
                  <option value="แผ่น" />
                  <option value="ชิ้น" />
                  <option value="ลิตร" />
                  <option value="ชุด" />
                  <option value="ตร.ม." />
                </datalist>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">ราคารวม (บาท)</label>
              <input type="number" min="0" step="0.01" className="form-input" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="0.00" required />
            </div>

            <div className="form-group">
              <label className="form-label">ชื่อร้านที่สั่งซื้อ / ใบเสร็จ</label>
              <input className="form-input" value={purchaseStore} onChange={e => setPurchaseStore(e.target.value)} placeholder="เช่น ร้านอุปกรณ์ไตรภาค, Shopee" />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px 0', fontSize: 16, marginTop: 12 }} disabled={saving}>
              <Send size={20} /> {saving ? 'กำลังบันทึก...' : 'บันทึกสั่งซื้อของ'}
            </button>
          </form>
        </div>
      )}

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
            {!editingItem && (
              <div className="form-group">
                <label className="form-label">จำนวนเริ่มต้น (ที่ซื้อตั้งต้น)</label>
                <input className="form-input" type="number" min="0" value={form.initial_stock} onChange={e => setForm({ ...form, initial_stock: parseFloat(e.target.value) || 0 })} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">แจ้งเตือนสต็อกต่ำเมื่อน้อยกว่า</label>
              <input className="form-input" type="number" min="0" value={form.min_stock_level} onChange={e => setForm({ ...form, min_stock_level: parseFloat(e.target.value) || 0 })} />
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
              <input className="form-input" type="number" min="0" step="0.5" value={adjustForm.quantity || ''} onChange={e => setAdjustForm({ ...adjustForm, quantity: parseFloat(e.target.value) || 0 })} autoFocus />
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

import { useState, useEffect } from 'react'
import { stockApi, purchaseApi, withdrawalApi } from '../api/client'
import type { StockItem, StockPurchase, StockWithdrawal } from '../types'
import { Package, Plus, Pencil, Trash2, Search, AlertTriangle, ShoppingCart, PackageMinus } from 'lucide-react'
import toast from 'react-hot-toast'

type Tab = 'stock' | 'purchases' | 'withdrawals'

export default function AdminStockPage() {
  const [tab, setTab] = useState<Tab>('stock')
  const [items, setItems] = useState<StockItem[]>([])
  const [purchases, setPurchases] = useState<StockPurchase[]>([])
  const [withdrawals, setWithdrawals] = useState<StockWithdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Stock modal
  const [showStockModal, setShowStockModal] = useState(false)
  const [editItem, setEditItem] = useState<StockItem | null>(null)
  const [stockForm, setStockForm] = useState({ name: '', unit: '', quantity: '' })

  // Purchase edit modal
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [editPurchase, setEditPurchase] = useState<StockPurchase | null>(null)
  const [pForm, setPForm] = useState({ item_id: '', quantity: '', price_per_unit: '', total_price: '', supplier: '', note: '' })

  // Withdrawal edit modal
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [editWithdrawal, setEditWithdrawal] = useState<StockWithdrawal | null>(null)
  const [wForm, setWForm] = useState({ item_id: '', quantity: '', purpose: '' })

  const fetchAll = async () => {
    try {
      const [s, p, w] = await Promise.all([stockApi.getAll(), purchaseApi.getAll(), withdrawalApi.getAll()])
      setItems(s.data || [])
      setPurchases(p.data || [])
      setWithdrawals(w.data || [])
    } catch { toast.error('โหลดข้อมูลไม่สำเร็จ') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const fmt = (d: string) => {
    const dt = new Date(d)
    return dt.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + dt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  }

  // ========== Stock CRUD ==========
  const openAddStock = () => { setEditItem(null); setStockForm({ name: '', unit: '', quantity: '' }); setShowStockModal(true) }
  const openEditStock = (i: StockItem) => { setEditItem(i); setStockForm({ name: i.name, unit: i.unit, quantity: String(i.quantity) }); setShowStockModal(true) }

  const saveStock = async () => {
    if (!stockForm.name.trim() || !stockForm.unit.trim()) { toast.error('กรอกชื่อและหน่วย'); return }
    try {
      if (editItem) { await stockApi.update(editItem.id, { name: stockForm.name, unit: stockForm.unit, quantity: parseFloat(stockForm.quantity) || 0 }); toast.success('แก้ไขสำเร็จ') }
      else { await stockApi.create({ name: stockForm.name, unit: stockForm.unit, quantity: parseFloat(stockForm.quantity) || 0 }); toast.success('เพิ่มสำเร็จ') }
      setShowStockModal(false); fetchAll()
    } catch { toast.error('บันทึกไม่สำเร็จ') }
  }

  const deleteStock = async (id: number, name: string) => {
    if (!confirm(`ลบ "${name}" จริงหรือ?`)) return
    try { await stockApi.delete(id); toast.success('ลบสำเร็จ'); fetchAll() } catch { toast.error('ลบไม่สำเร็จ') }
  }

  // ========== Purchase Edit/Delete ==========
  const openEditPurchase = (p: StockPurchase) => {
    setEditPurchase(p)
    setPForm({ item_id: String(p.item_id), quantity: String(p.quantity), price_per_unit: String(p.price_per_unit), total_price: String(p.total_price), supplier: p.supplier || '', note: p.note || '' })
    setShowPurchaseModal(true)
  }
  const savePurchase = async () => {
    if (!editPurchase) return
    const qty = parseFloat(pForm.quantity) || 0
    let ppu = parseFloat(pForm.price_per_unit) || 0
    let tp = parseFloat(pForm.total_price) || 0
    if (ppu > 0 && tp === 0) tp = ppu * qty
    if (tp > 0 && ppu === 0 && qty > 0) ppu = tp / qty
    try {
      await purchaseApi.update(editPurchase.id, { item_id: parseInt(pForm.item_id), quantity: qty, price_per_unit: ppu, total_price: tp, supplier: pForm.supplier, note: pForm.note })
      toast.success('แก้ไขสำเร็จ'); setShowPurchaseModal(false); fetchAll()
    } catch { toast.error('แก้ไขไม่สำเร็จ') }
  }
  const deletePurchase = async (id: number) => {
    if (!confirm('ลบรายการซื้อนี้? สต็อกจะถูกปรับกลับ')) return
    try { await purchaseApi.delete(id); toast.success('ลบสำเร็จ'); fetchAll() } catch { toast.error('ลบไม่สำเร็จ') }
  }

  // ========== Withdrawal Edit/Delete ==========
  const openEditWithdrawal = (w: StockWithdrawal) => {
    setEditWithdrawal(w)
    setWForm({ item_id: String(w.item_id), quantity: String(w.quantity), purpose: w.purpose || '' })
    setShowWithdrawalModal(true)
  }
  const saveWithdrawal = async () => {
    if (!editWithdrawal) return
    try {
      await withdrawalApi.update(editWithdrawal.id, { item_id: parseInt(wForm.item_id), quantity: parseFloat(wForm.quantity) || 0, purpose: wForm.purpose })
      toast.success('แก้ไขสำเร็จ'); setShowWithdrawalModal(false); fetchAll()
    } catch { toast.error('แก้ไขไม่สำเร็จ') }
  }
  const deleteWithdrawal = async (id: number) => {
    if (!confirm('ลบรายการเบิกนี้? สต็อกจะถูกปรับกลับ')) return
    try { await withdrawalApi.delete(id); toast.success('ลบสำเร็จ'); fetchAll() } catch { toast.error('ลบไม่สำเร็จ') }
  }

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
  const lowStock = items.filter(i => i.quantity <= 5)

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Package size={22} /> Stock — สต็อกสินค้า</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>สต็อกคงเหลือ + ประวัติซื้อเข้า/เบิกออก</p>
        </div>
        {tab === 'stock' && <button className="btn btn-primary" onClick={openAddStock}><Plus size={16} /> เพิ่มสินค้า</button>}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        <button className={`btn ${tab === 'stock' ? 'btn-primary' : ''}`} onClick={() => setTab('stock')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Package size={15} /> สต็อกคงเหลือ ({items.length})
        </button>
        <button className={`btn ${tab === 'purchases' ? 'btn-primary' : ''}`} onClick={() => setTab('purchases')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShoppingCart size={15} /> ซื้อเข้า ({purchases.length})
        </button>
        <button className={`btn ${tab === 'withdrawals' ? 'btn-primary' : ''}`} onClick={() => setTab('withdrawals')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <PackageMinus size={15} /> เบิกออก ({withdrawals.length})
        </button>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input className="form-input" placeholder="ค้นหา..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, border: 'none', boxShadow: 'none', padding: '6px 0' }} />
        </div>
      </div>

      {loading ? <div className="card"><p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>กำลังโหลด...</p></div> :

      /* ========== TAB: STOCK ========== */
      tab === 'stock' ? (
        <div>
          {lowStock.length > 0 && (
            <div className="card" style={{ background: '#fffbeb', borderColor: '#fbbf24', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b45309', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                <AlertTriangle size={18} /> สินค้าใกล้หมด ({lowStock.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {lowStock.map(i => <span key={i.id} style={{ background: '#fef3c7', padding: '3px 10px', borderRadius: 6, fontSize: 12, color: '#92400e' }}>{i.name}: {i.quantity} {i.unit}</span>)}
              </div>
            </div>
          )}
          <div className="card">
            {filteredItems.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>ไม่มีสินค้า</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table responsive-table"><thead><tr><th>#</th><th>ชื่อสินค้า</th><th>หน่วย</th><th style={{ textAlign: 'right' }}>คงเหลือ</th><th style={{ textAlign: 'center' }}>จัดการ</th></tr></thead>
                <tbody>{filteredItems.map((item, idx) => (
                  <tr key={item.id}>
                    <td data-label="#" style={{ color: 'var(--text-muted)', width: 40 }}>{idx + 1}</td>
                    <td data-label="ชื่อสินค้า" style={{ fontWeight: 500 }}>{item.name}</td>
                    <td data-label="หน่วย">{item.unit}</td>
                    <td data-label="คงเหลือ" style={{ textAlign: 'right', fontWeight: 600, color: item.quantity <= 5 ? 'var(--danger)' : 'var(--text-primary)' }}>{item.quantity.toLocaleString()}</td>
                    <td data-label="จัดการ" style={{ textAlign: 'center' }}><div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button className="btn btn-sm" onClick={() => openEditStock(item)}><Pencil size={14} /></button>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteStock(item.id, item.name)}><Trash2 size={14} /></button>
                    </div></td>
                  </tr>
                ))}</tbody></table>
              </div>
            )}
          </div>
        </div>
      ) :

      /* ========== TAB: PURCHASES ========== */
      tab === 'purchases' ? (
        <div className="card">
          {purchases.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>ไม่มีประวัติ</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table responsive-table"><thead><tr><th>วันที่</th><th>สินค้า</th><th style={{ textAlign: 'right' }}>จำนวน</th><th style={{ textAlign: 'right' }}>ราคา/หน่วย</th><th style={{ textAlign: 'right' }}>รวม</th><th>ร้าน</th><th>ผู้บันทึก</th><th>หมายเหตุ</th><th style={{ textAlign: 'center' }}>จัดการ</th></tr></thead>
              <tbody>{purchases.filter(p => {
                const q = search.toLowerCase()
                return (p.item_name || p.stock_items?.name || '').toLowerCase().includes(q) || (p.supplier || '').toLowerCase().includes(q)
              }).map(p => (
                <tr key={p.id}>
                  <td data-label="วันที่" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{fmt(p.purchased_at)}</td>
                  <td data-label="สินค้า" style={{ fontWeight: 500 }}>{p.item_name || p.stock_items?.name || '-'}</td>
                  <td data-label="จำนวน" style={{ textAlign: 'right' }}>{p.quantity} {p.item_unit || p.stock_items?.unit || ''}</td>
                  <td data-label="ราคา/หน่วย" style={{ textAlign: 'right' }}>{p.price_per_unit?.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                  <td data-label="รวม" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>฿{p.total_price?.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                  <td data-label="ร้าน">{p.supplier || '-'}</td>
                  <td data-label="ผู้บันทึก" style={{ fontSize: 12 }}>{p.purchased_by_email || p.users?.email || '-'}</td>
                  <td data-label="หมายเหตุ" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.note || '-'}</td>
                  <td data-label="จัดการ" style={{ textAlign: 'center' }}><div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                    <button className="btn btn-sm" onClick={() => openEditPurchase(p)}><Pencil size={14} /></button>
                    <button className="btn btn-sm btn-danger" onClick={() => deletePurchase(p.id)}><Trash2 size={14} /></button>
                  </div></td>
                </tr>
              ))}</tbody></table>
            </div>
          )}
        </div>
      ) :

      /* ========== TAB: WITHDRAWALS ========== */
      (
        <div className="card">
          {withdrawals.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>ไม่มีประวัติ</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table responsive-table"><thead><tr><th>วันที่</th><th>สินค้า</th><th style={{ textAlign: 'right' }}>จำนวน</th><th>เบิกเพื่อ</th><th>ผู้เบิก</th><th style={{ textAlign: 'center' }}>จัดการ</th></tr></thead>
              <tbody>{withdrawals.filter(w => {
                const q = search.toLowerCase()
                return (w.item_name || w.stock_items?.name || '').toLowerCase().includes(q) || (w.purpose || '').toLowerCase().includes(q)
              }).map(w => (
                <tr key={w.id}>
                  <td data-label="วันที่" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{fmt(w.withdrawn_at)}</td>
                  <td data-label="สินค้า" style={{ fontWeight: 500 }}>{w.item_name || w.stock_items?.name || '-'}</td>
                  <td data-label="จำนวน" style={{ textAlign: 'right', color: 'var(--danger)', fontWeight: 600 }}>-{w.quantity} {w.item_unit || w.stock_items?.unit || ''}</td>
                  <td data-label="เบิกเพื่อ">{w.purpose || '-'}</td>
                  <td data-label="ผู้เบิก" style={{ fontSize: 12 }}>{w.withdrawn_by_email || w.users?.email || '-'}</td>
                  <td data-label="จัดการ" style={{ textAlign: 'center' }}><div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                    <button className="btn btn-sm" onClick={() => openEditWithdrawal(w)}><Pencil size={14} /></button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteWithdrawal(w.id)}><Trash2 size={14} /></button>
                  </div></td>
                </tr>
              ))}</tbody></table>
            </div>
          )}
        </div>
      )}

      {/* Stock Modal */}
      {showStockModal && (
        <div className="modal-overlay" onClick={() => setShowStockModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
          <h3 style={{ marginBottom: 20 }}>{editItem ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h3>
          <div className="form-group"><label className="form-label">ชื่อสินค้า</label><input className="form-input" value={stockForm.name} onChange={e => setStockForm({ ...stockForm, name: e.target.value })} placeholder="เช่น หมึก Outdoor" autoFocus /></div>
          <div className="form-group"><label className="form-label">หน่วย</label><input className="form-input" value={stockForm.unit} onChange={e => setStockForm({ ...stockForm, unit: e.target.value })} placeholder="เช่น ขวด" /></div>
          <div className="form-group"><label className="form-label">จำนวน</label><input className="form-input" type="number" min="0" step="0.01" value={stockForm.quantity} onChange={e => setStockForm({ ...stockForm, quantity: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}><button className="btn" onClick={() => setShowStockModal(false)}>ยกเลิก</button><button className="btn btn-primary" onClick={saveStock}>{editItem ? 'บันทึก' : 'เพิ่ม'}</button></div>
        </div></div>
      )}

      {/* Purchase Edit Modal */}
      {showPurchaseModal && editPurchase && (
        <div className="modal-overlay" onClick={() => setShowPurchaseModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
          <h3 style={{ marginBottom: 20 }}>แก้ไขรายการซื้อ</h3>
          <div className="form-group"><label className="form-label">สินค้า</label>
            <select className="form-input" value={pForm.item_id} onChange={e => setPForm({ ...pForm, item_id: e.target.value })}>
              {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group"><label className="form-label">จำนวน</label><input className="form-input" type="number" value={pForm.quantity} onChange={e => setPForm({ ...pForm, quantity: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">ราคา/หน่วย</label><input className="form-input" type="number" value={pForm.price_per_unit} onChange={e => setPForm({ ...pForm, price_per_unit: e.target.value, total_price: '' })} /></div>
          </div>
          <div className="form-group"><label className="form-label">ราคารวม</label><input className="form-input" type="number" value={pForm.total_price} onChange={e => setPForm({ ...pForm, total_price: e.target.value, price_per_unit: '' })} /></div>
          <div className="form-group"><label className="form-label">ร้านค้า</label><input className="form-input" value={pForm.supplier} onChange={e => setPForm({ ...pForm, supplier: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">หมายเหตุ</label><input className="form-input" value={pForm.note} onChange={e => setPForm({ ...pForm, note: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}><button className="btn" onClick={() => setShowPurchaseModal(false)}>ยกเลิก</button><button className="btn btn-primary" onClick={savePurchase}>บันทึก</button></div>
        </div></div>
      )}

      {/* Withdrawal Edit Modal */}
      {showWithdrawalModal && editWithdrawal && (
        <div className="modal-overlay" onClick={() => setShowWithdrawalModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
          <h3 style={{ marginBottom: 20 }}>แก้ไขรายการเบิก</h3>
          <div className="form-group"><label className="form-label">สินค้า</label>
            <select className="form-input" value={wForm.item_id} onChange={e => setWForm({ ...wForm, item_id: e.target.value })}>
              {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">จำนวน</label><input className="form-input" type="number" value={wForm.quantity} onChange={e => setWForm({ ...wForm, quantity: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">เบิกเพื่อ</label><textarea className="form-input" value={wForm.purpose} onChange={e => setWForm({ ...wForm, purpose: e.target.value })} rows={2} style={{ resize: 'vertical', fontFamily: 'inherit' }} /></div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}><button className="btn" onClick={() => setShowWithdrawalModal(false)}>ยกเลิก</button><button className="btn btn-primary" onClick={saveWithdrawal}>บันทึก</button></div>
        </div></div>
      )}
    </div>
  )
}

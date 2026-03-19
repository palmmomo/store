import { useEffect, useState } from 'react'
import { stockApi, productApi } from '../api/client'
import type { StockItem, Product } from '../types'
import { Package, Plus, TrendingUp, TrendingDown, Search, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StockPage() {
  const [stock, setStock] = useState<StockItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState<StockItem | null>(null)
  const [adjustValue, setAdjustValue] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [newStock, setNewStock] = useState({ product_id: '', quantity: '0', min_level: '5', unit: 'ชิ้น', branch_id: '' })

  const load = async () => {
    try {
      const [sRes, pRes] = await Promise.all([stockApi.getAll(), productApi.getAll()])
      setStock(sRes.data)
      setProducts(pRes.data)
    } catch (e) {
      toast.error('โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = stock.filter((s) => {
    const name = s.products?.name?.toLowerCase() || ''
    return name.includes(search.toLowerCase())
  })

  const handleAdjust = async () => {
    if (!showAdjustModal || !adjustValue || !adjustReason) return
    try {
      await stockApi.update(showAdjustModal.id, { change: parseInt(adjustValue), reason: adjustReason })
      toast.success('อัพเดทสต็อกสำเร็จ')
      setShowAdjustModal(null)
      setAdjustValue('')
      setAdjustReason('')
      load()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'เกิดข้อผิดพลาด')
    }
  }

  const handleAddStock = async () => {
    try {
      await stockApi.create({
        ...newStock,
        quantity: parseInt(newStock.quantity),
        min_level: parseInt(newStock.min_level),
      })
      toast.success('เพิ่มสต็อกสำเร็จ')
      setShowAddModal(false)
      load()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'เกิดข้อผิดพลาด')
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">สต็อกสินค้า</h1>
          <p className="page-subtitle">จัดการสต็อกและปริมาณสินค้า</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={load}><RefreshCw size={16} /> รีเฟรช</button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><Plus size={16} /> เพิ่มสต็อก</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={16} color="var(--text-muted)" />
            <input placeholder="ค้นหาสินค้า..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="toolbar-right">
          <span className="tag">{filtered.length} รายการ</span>
          <span className="tag" style={{ color: 'var(--danger)' }}>
            {stock.filter((s) => s.quantity <= s.min_level).length} ต่ำกว่ากำหนด
          </span>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>สินค้า</th>
              <th>หมวดหมู่</th>
              <th>จำนวน</th>
              <th>ขั้นต่ำ</th>
              <th>หน่วย</th>
              <th>สถานะ</th>
              <th>อัพเดทล่าสุด</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const isLow = s.quantity <= s.min_level
              return (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Package size={14} color="var(--text-muted)" />
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.products?.name || '-'}</span>
                    </div>
                  </td>
                  <td><span className="tag">{s.products?.category || '-'}</span></td>
                  <td>
                    <span style={{ fontSize: 16, fontWeight: 700, color: isLow ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {s.quantity}
                    </span>
                  </td>
                  <td>{s.min_level}</td>
                  <td>{s.unit}</td>
                  <td>
                    {isLow
                      ? <span className="badge badge-danger">⚠ ต่ำกว่ากำหนด</span>
                      : <span className="badge badge-success">ปกติ</span>}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(s.updated_at).toLocaleDateString('th-TH')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => { setShowAdjustModal(s); setAdjustValue('') }}>
                        <TrendingUp size={12} /> ปรับ
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8}><div className="empty-state"><Package /><p>ไม่มีข้อมูลสต็อก</p></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Adjust Modal */}
      {showAdjustModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">ปรับสต็อก: {showAdjustModal.products?.name}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
              สต็อกปัจจุบัน: <strong>{showAdjustModal.quantity} {showAdjustModal.unit}</strong>
            </p>
            <div className="form-group">
              <label className="form-label">จำนวนที่ต้องการปรับ (ใส่ - เพื่อลด)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setAdjustValue('-1')}><TrendingDown size={12} /> -1</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setAdjustValue('-5')}>-5</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setAdjustValue('-10')}>-10</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setAdjustValue('+1')}><TrendingUp size={12} /> +1</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setAdjustValue('+10')}>+10</button>
              </div>
              <input className="form-input" style={{ marginTop: 8 }} type="number" placeholder="เช่น 10 หรือ -5" value={adjustValue} onChange={(e) => setAdjustValue(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">เหตุผล</label>
              <input className="form-input" placeholder="เช่น รับสินค้าใหม่, ขายออก, สูญหาย" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAdjustModal(null)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleAdjust}>บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">เพิ่มสต็อกสินค้า</h2>
            <div className="form-group">
              <label className="form-label">เลือกสินค้า</label>
              <select className="form-input form-select" value={newStock.product_id} onChange={(e) => setNewStock({ ...newStock, product_id: e.target.value })}>
                <option value="">-- เลือกสินค้า --</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">จำนวนเริ่มต้น</label>
              <input className="form-input" type="number" value={newStock.quantity} onChange={(e) => setNewStock({ ...newStock, quantity: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">ขั้นต่ำที่แจ้งเตือน</label>
              <input className="form-input" type="number" value={newStock.min_level} onChange={(e) => setNewStock({ ...newStock, min_level: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">หน่วย</label>
              <input className="form-input" placeholder="เช่น ชิ้น, กล่อง, กก." value={newStock.unit} onChange={(e) => setNewStock({ ...newStock, unit: e.target.value })} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleAddStock}>เพิ่ม</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

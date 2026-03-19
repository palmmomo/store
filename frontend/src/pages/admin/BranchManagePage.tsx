import { useEffect, useState } from 'react'
import { branchApi } from '../../api/client'
import type { Branch } from '../../types'
import { Building2, Plus, Pencil, PowerOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BranchManagePage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editBranch, setEditBranch] = useState<Branch | null>(null)
  const [form, setForm] = useState({ name: '', address: '', phone: '' })

  const load = async () => {
    try {
      const r = await branchApi.getAll()
      setBranches(r.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditBranch(null); setForm({ name: '', address: '', phone: '' }); setShowModal(true) }
  const openEdit = (b: Branch) => { setEditBranch(b); setForm({ name: b.name, address: b.address, phone: b.phone }); setShowModal(true) }

  const handleSave = async () => {
    try {
      if (editBranch) {
        await branchApi.update(editBranch.id, form)
        toast.success('อัพเดทสาขาสำเร็จ')
      } else {
        await branchApi.create(form)
        toast.success('เพิ่มสาขาสำเร็จ')
      }
      setShowModal(false)
      load()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'เกิดข้อผิดพลาด')
    }
  }

  const handleToggle = async (b: Branch) => {
    try {
      await branchApi.update(b.id, { is_active: !b.is_active })
      toast.success(b.is_active ? 'ปิดสาขาแล้ว' : 'เปิดสาขาแล้ว')
      load()
    } catch {
      toast.error('เกิดข้อผิดพลาด')
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">จัดการสาขา</h1>
          <p className="page-subtitle">เพิ่ม แก้ไข ปิด/เปิดสาขาร้านค้า</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> เพิ่มสาขา</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {branches.map((b) => (
          <div key={b.id} className="card" style={{ opacity: b.is_active ? 1 : 0.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="stat-icon blue" style={{ width: 40, height: 40 }}>
                  <Building2 size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 16 }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{b.address || 'ไม่มีที่อยู่'}</div>
                  {b.phone && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>📞 {b.phone}</div>}
                </div>
              </div>
              <span className={`badge ${b.is_active ? 'badge-success' : 'badge-danger'}`}>
                {b.is_active ? 'เปิด' : 'ปิด'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(b)}><Pencil size={12} /> แก้ไข</button>
              <button className={`btn btn-sm ${b.is_active ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(b)}>
                <PowerOff size={12} /> {b.is_active ? 'ปิด' : 'เปิด'}
              </button>
            </div>
          </div>
        ))}
        {branches.length === 0 && <div className="empty-state"><Building2 /><p>ยังไม่มีสาขา</p></div>}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">{editBranch ? 'แก้ไขสาขา' : 'เพิ่มสาขาใหม่'}</h2>
            <div className="form-group">
              <label className="form-label">ชื่อสาขา *</label>
              <input className="form-input" placeholder="เช่น สาขาลาดพร้าว" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">ที่อยู่</label>
              <input className="form-input" placeholder="ที่อยู่สาขา" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">เบอร์โทร</label>
              <input className="form-input" placeholder="02-xxx-xxxx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleSave}>บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

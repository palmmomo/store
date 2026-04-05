import { useState, useEffect } from 'react'
import { branchApi } from '../../api/client'
import { toast } from 'react-hot-toast'
import { Plus, Pencil, Trash2, Building2, X, Check } from 'lucide-react'

interface Branch {
  id: string
  name: string
  address: string
  phone: string
  created_at: string
}

export default function BranchManagePage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', phone: '' })
  const [inlineEdit, setInlineEdit] = useState<Record<string, { name: string; address: string; phone: string } | null>>({})

  const load = async () => {
    try {
      const res = await branchApi.getAll()
      setBranches(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error('Load branches error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.name) return
    try {
      await branchApi.create(form)
      toast.success('เพิ่มสาขาสำเร็จ')
      setShowModal(false)
      setForm({ name: '', address: '', phone: '' })
      load()
    } catch (err) {
      toast.error('ไม่สามารถเพิ่มสาขาได้')
      console.error(err)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`ยืนยันลบสาขา "${name}"?\n\nข้อมูลวัสดุ/สต็อกของสาขานี้จะถูกลบทั้งหมด`)) return
    try {
      await branchApi.delete(id)
      toast.success(`ลบสาขา ${name} แล้ว`)
      load()
    } catch (err) {
      toast.error('ไม่สามารถลบสาขาได้')
      console.error(err)
    }
  }

  const openEdit = (b: Branch) => {
    setInlineEdit(prev => ({ ...prev, [b.id]: { name: b.name, address: b.address, phone: b.phone } }))
  }

  const cancelEdit = (id: string) => {
    setInlineEdit(prev => ({ ...prev, [id]: null }))
  }

  const saveEdit = async (id: string) => {
    const data = inlineEdit[id]
    if (!data || !data.name) return
    try {
      await branchApi.update(id, data)
      toast.success('บันทึกสาขาสำเร็จ')
      setInlineEdit(prev => ({ ...prev, [id]: null }))
      load()
    } catch (err) {
      toast.error('ไม่สามารถแก้ไขสาขาได้')
      console.error(err)
    }
  }

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: 24 }}>กำลังโหลดข้อมูลสาขา...</p>

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">จัดการสาขา</h1><p className="page-subtitle">เพิ่ม แก้ไข ลบสาขา</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', address: '', phone: '' }); setShowModal(true) }}>
          <Plus size={16} /> เพิ่มสาขาใหม่
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {branches.map(b => {
          const ie = inlineEdit[b.id]
          return (
            <div key={b.id} className="card branch-card" style={{ position: 'relative' }}>
              {ie ? (
                <div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                    <div className="stat-icon blue" style={{ width: 36, height: 36, flexShrink: 0 }}><Building2 size={16} /></div>
                    <input className="form-input" style={{ fontWeight: 700, fontSize: 14 }} value={ie.name} placeholder="ชื่อสาขา"
                      onChange={e => setInlineEdit(prev => ({ ...prev, [b.id]: { ...ie, name: e.target.value } }))} autoFocus />
                  </div>
                  <input className="form-input" style={{ marginBottom: 6, fontSize: 12 }} value={ie.address} placeholder="ที่อยู่"
                    onChange={e => setInlineEdit(prev => ({ ...prev, [b.id]: { ...ie, address: e.target.value } }))} />
                  <input className="form-input" style={{ marginBottom: 10, fontSize: 12 }} value={ie.phone} placeholder="เบอร์โทร"
                    onChange={e => setInlineEdit(prev => ({ ...prev, [b.id]: { ...ie, phone: e.target.value } }))} />
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => cancelEdit(b.id)}><X size={13} /> ยกเลิก</button>
                    <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => saveEdit(b.id)}><Check size={13} /> บันทึก</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div className="stat-icon blue" style={{ width: 36, height: 36 }}><Building2 size={16} /></div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{b.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{b.address || '-'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{b.phone || '-'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-icon" title="แก้ไข" onClick={() => openEdit(b)}><Pencil size={13} /></button>
                      <button className="btn-icon delete" title="ลบสาขา" onClick={() => handleDelete(b.id, b.name)}><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {branches.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <Building2 size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><br />ยังไม่มีสาขา
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">เพิ่มสาขาใหม่</h2>
            <div className="form-group">
              <label className="form-label">ชื่อสาขา</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="เช่น สาขาพระราม 9" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">ที่อยู่</label>
              <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="ที่อยู่สาขา" />
            </div>
            <div className="form-group">
              <label className="form-label">เบอร์โทรศัพท์</label>
              <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="02-xxx-xxxx" />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!form.name}>บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { branchApi } from '../api/client'
import type { Branch } from '../types'
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [edit, setEdit] = useState<Branch | null>(null)
  const [form, setForm] = useState({ name: '', address: '', phone: '', tax_id: '' })

  const fetch = async () => {
    try { const r = await branchApi.getAll(); setBranches(r.data || []) }
    catch { toast.error('โหลดข้อมูลไม่สำเร็จ') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetch() }, [])

  const openAdd = () => { setEdit(null); setForm({ name: '', address: '', phone: '', tax_id: '' }); setShowModal(true) }
  const openEdit = (b: Branch) => { setEdit(b); setForm({ name: b.name, address: b.address, phone: b.phone, tax_id: b.tax_id }); setShowModal(true) }

  const save = async () => {
    if (!form.name.trim()) { toast.error('กรุณากรอกชื่อสาขา'); return }
    try {
      if (edit) { await branchApi.update(edit.id, form); toast.success('แก้ไขสำเร็จ') }
      else { await branchApi.create(form); toast.success('เพิ่มสำเร็จ') }
      setShowModal(false); fetch()
    } catch { toast.error('บันทึกไม่สำเร็จ') }
  }

  const del = async (id: number, name: string) => {
    if (!confirm(`ลบสาขา "${name}"?`)) return
    try { await branchApi.delete(id); toast.success('ลบสำเร็จ'); fetch() } catch (err: any) { toast.error(err.response?.data?.error || 'ลบไม่สำเร็จ') }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Building2 size={22} /> สาขา</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>ข้อมูลสาขาสำหรับใบเสนอราคา</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> เพิ่มสาขา</button>
      </div>

      <div className="card">
        {loading ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>กำลังโหลด...</p> :
        branches.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>ยังไม่มีสาขา</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table responsive-table"><thead><tr><th>#</th><th>ชื่อสาขา</th><th>ที่อยู่</th><th>โทร</th><th>เลขผู้เสียภาษี</th><th style={{ textAlign: 'center' }}>จัดการ</th></tr></thead>
            <tbody>{branches.map((b, i) => (
              <tr key={b.id}>
                <td data-label="#">{i + 1}</td>
                <td data-label="ชื่อสาขา" style={{ fontWeight: 500 }}>{b.name}</td>
                <td data-label="ที่อยู่" style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.address || '-'}</td>
                <td data-label="โทร">{b.phone || '-'}</td>
                <td data-label="เลขผู้เสียภาษี" style={{ fontSize: 12 }}>{b.tax_id || '-'}</td>
                <td data-label="จัดการ" style={{ textAlign: 'center' }}><div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                  <button className="btn btn-sm" onClick={() => openEdit(b)}><Pencil size={14} /></button>
                  <button className="btn btn-sm btn-danger" onClick={() => del(b.id, b.name)}><Trash2 size={14} /></button>
                </div></td>
              </tr>
            ))}</tbody></table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
          <h3 style={{ marginBottom: 20 }}>{edit ? 'แก้ไขสาขา' : 'เพิ่มสาขาใหม่'}</h3>
          <div className="form-group"><label className="form-label">ชื่อสาขา *</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="ห้างหุ้นส่วนจำกัด ..." autoFocus /></div>
          <div className="form-group"><label className="form-label">ที่อยู่</label><textarea className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} style={{ resize: 'vertical', fontFamily: 'inherit' }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group"><label className="form-label">โทร</label><input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">เลขผู้เสียภาษี</label><input className="form-input" value={form.tax_id} onChange={e => setForm({ ...form, tax_id: e.target.value })} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}><button className="btn" onClick={() => setShowModal(false)}>ยกเลิก</button><button className="btn btn-primary" onClick={save}>{edit ? 'บันทึก' : 'เพิ่ม'}</button></div>
        </div></div>
      )}
    </div>
  )
}

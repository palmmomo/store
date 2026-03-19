import { useEffect, useState } from 'react'
import { adminApi, branchApi } from '../../api/client'
import type { Branch } from '../../types'
import { Users, Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState<any | null>(null)
  const [form, setForm] = useState({ email: '', role: 'staff', branch_id: '' })

  const load = async () => {
    try {
      const [uRes, bRes] = await Promise.all([adminApi.getUsers(), branchApi.getAll()])
      setUsers(uRes.data?.users || [])
      setBranches(bRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openInvite = () => { setEditUser(null); setForm({ email: '', role: 'staff', branch_id: '' }); setShowModal(true) }
  const openEdit = (u: any) => {
    setEditUser(u)
    setForm({ email: u.email, role: u.app_metadata?.role || 'staff', branch_id: u.app_metadata?.branch_id || '' })
    setShowModal(true)
  }

  const handleSave = async () => {
    try {
      if (editUser) {
        await adminApi.updateUserRole(editUser.id, { role: form.role, branch_id: form.branch_id })
        toast.success('อัพเดทผู้ใช้สำเร็จ')
      } else {
        await adminApi.inviteUser(form)
        toast.success('เชิญผู้ใช้สำเร็จ')
      }
      setShowModal(false)
      load()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'เกิดข้อผิดพลาด')
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('ยืนยันการลบผู้ใช้?')) return
    try {
      await adminApi.deleteUser(userId)
      toast.success('ลบผู้ใช้สำเร็จ')
      load()
    } catch {
      toast.error('เกิดข้อผิดพลาด')
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === 'superadmin') return <span className="badge badge-purple">Superadmin</span>
    if (role === 'branch_admin') return <span className="badge badge-info">Branch Admin</span>
    return <span className="badge">Staff</span>
  }

  const getBranchName = (branchId: string) => {
    const b = branches.find((b) => b.id === branchId)
    return b?.name || '-'
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">จัดการผู้ใช้</h1>
          <p className="page-subtitle">จัดการสิทธิ์และบัญชีผู้ใช้</p>
        </div>
        <button className="btn btn-primary" onClick={openInvite}><Plus size={16} /> เพิ่มผู้ใช้</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>อีเมล</th>
              <th>บทบาท</th>
              <th>สาขา</th>
              <th>สร้างเมื่อ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{u.email}</td>
                <td>{getRoleBadge(u.app_metadata?.role || 'staff')}</td>
                <td style={{ fontSize: 13 }}>{getBranchName(u.app_metadata?.branch_id)}</td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString('th-TH')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}><Pencil size={12} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5}><div className="empty-state"><Users /><p>ไม่มีผู้ใช้</p></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">{editUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</h2>
            {!editUser && (
              <div className="form-group">
                <label className="form-label">อีเมล *</label>
                <input className="form-input" type="email" placeholder="user@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">บทบาท</label>
              <select className="form-input form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="staff">Staff (พนักงานทั่วไป)</option>
                <option value="branch_admin">Branch Admin (ผู้จัดการสาขา)</option>
                <option value="superadmin">Superadmin (ผู้ดูแลระบบ)</option>
              </select>
            </div>
            {form.role !== 'superadmin' && (
              <div className="form-group">
                <label className="form-label">สาขา</label>
                <select className="form-input form-select" value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })}>
                  <option value="">-- เลือกสาขา --</option>
                  {branches.filter(b => b.is_active).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
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

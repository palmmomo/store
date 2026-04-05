import { useState, useEffect } from 'react'
import { adminApi, branchApi } from '../../api/client'
import { toast } from 'react-hot-toast'
import { Plus, Trash2, Pencil, Users as UsersIcon, X } from 'lucide-react'

interface SupabaseUser {
  id: string
  email: string
  created_at: string
  app_metadata?: { role?: string; branch_id?: string }
  user_metadata?: { full_name?: string }
}

interface Branch {
  id: string
  name: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<SupabaseUser[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState<SupabaseUser | null>(null)
  const [createForm, setCreateForm] = useState({ email: '', password: '', full_name: '', role: 'staff', branch_id: '' })
  const [editForm, setEditForm] = useState({ role: 'staff', branch_id: '' })

  const load = async () => {
    try {
      const [usersRes, branchRes] = await Promise.all([
        adminApi.getUsers(),
        branchApi.getAll(),
      ])
      const userData = usersRes.data?.users || []
      setUsers(Array.isArray(userData) ? userData : [])
      setBranches(Array.isArray(branchRes.data) ? branchRes.data : [])
    } catch (err) {
      console.error('Load users error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!createForm.email || !createForm.password) return
    try {
      await adminApi.createUser(createForm)
      toast.success(`สร้างผู้ใช้ ${createForm.email} สำเร็จ`)
      setShowCreate(false)
      setCreateForm({ email: '', password: '', full_name: '', role: 'staff', branch_id: '' })
      load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { msg?: string } } })?.response?.data?.msg || 'ไม่สามารถสร้างผู้ใช้ได้'
      toast.error(msg)
    }
  }

  const handleUpdateRole = async () => {
    if (!showEdit) return
    try {
      await adminApi.updateUserRole(showEdit.id, editForm)
      toast.success('อัปเดตสิทธิ์สำเร็จ')
      setShowEdit(null)
      load()
    } catch (err) {
      toast.error('ไม่สามารถอัปเดตได้')
      console.error(err)
    }
  }

  const handleDelete = async (u: SupabaseUser) => {
    if (!confirm(`ยืนยันลบผู้ใช้ "${u.email}"?`)) return
    try {
      await adminApi.deleteUser(u.id)
      toast.success(`ลบผู้ใช้ ${u.email} แล้ว`)
      load()
    } catch (err) {
      toast.error('ไม่สามารถลบผู้ใช้ได้')
      console.error(err)
    }
  }

  const getBranchName = (id?: string) => {
    if (!id) return '-'
    return branches.find(b => b.id === id)?.name || id
  }

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: 24 }}>กำลังโหลดข้อมูลผู้ใช้...</p>

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">จัดการผู้ใช้</h1><p className="page-subtitle">สร้าง แก้ไข ลบผู้ใช้งาน</p></div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> สร้างผู้ใช้ใหม่</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr><th>อีเมล</th><th>ชื่อ</th><th>สิทธิ์</th><th>สาขา</th><th style={{ textAlign: 'right' }}>จัดการ</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500 }}>{u.email}</td>
                <td>{u.user_metadata?.full_name || '-'}</td>
                <td>
                  <span className={`badge ${u.app_metadata?.role === 'superadmin' ? 'badge-info' : 'badge-success'}`}>
                    {u.app_metadata?.role || 'staff'}
                  </span>
                </td>
                <td style={{ fontSize: 13 }}>{getBranchName(u.app_metadata?.branch_id)}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <button className="btn-icon" title="แก้ไขสิทธิ์" onClick={() => {
                      setShowEdit(u)
                      setEditForm({ role: u.app_metadata?.role || 'staff', branch_id: u.app_metadata?.branch_id || '' })
                    }}><Pencil size={13} /></button>
                    <button className="btn-icon delete" title="ลบ" onClick={() => handleDelete(u)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                <UsersIcon size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><br />ยังไม่มีผู้ใช้
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>สร้างผู้ใช้ใหม่</h2>
              <button className="btn-icon" onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">อีเมล</label>
              <input className="form-input" type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} placeholder="user@example.com" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">รหัสผ่าน (ขั้นต่ำ 6 ตัว)</label>
              <input className="form-input" type="password" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">ชื่อ-สกุล</label>
              <input className="form-input" value={createForm.full_name} onChange={e => setCreateForm({ ...createForm, full_name: e.target.value })} placeholder="ชื่อ-สกุลผู้ใช้" />
            </div>
            <div className="form-group">
              <label className="form-label">สิทธิ์การใช้งาน</label>
              <select className="form-input" value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value })}>
                <option value="staff">Staff (พนักงานสาขา)</option>
                <option value="branch_admin">Branch Admin (ผู้จัดการสาขา)</option>
                <option value="superadmin">Super Admin (ดูแลทั้งหมด)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">สาขา</label>
              <select className="form-input" value={createForm.branch_id} onChange={e => setCreateForm({ ...createForm, branch_id: e.target.value })}>
                <option value="">-- ไม่มีสาขา --</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!createForm.email || !createForm.password}>สร้าง</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEdit && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>แก้ไขสิทธิ์: {showEdit.email}</h2>
              <button className="btn-icon" onClick={() => setShowEdit(null)}><X size={18} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">สิทธิ์การใช้งาน</label>
              <select className="form-input" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                <option value="staff">Staff</option>
                <option value="branch_admin">Branch Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">สาขา</label>
              <select className="form-input" value={editForm.branch_id} onChange={e => setEditForm({ ...editForm, branch_id: e.target.value })}>
                <option value="">-- ไม่มีสาขา --</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEdit(null)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleUpdateRole}>บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

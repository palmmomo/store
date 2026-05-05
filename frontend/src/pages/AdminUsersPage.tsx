import { useState, useEffect } from 'react'
import { adminApi } from '../api/client'
import { Users, Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface SupabaseUserItem {
  id: string
  email: string
  app_metadata?: { role?: string }
  created_at: string
}

const roleLabels: Record<string, string> = {
  admin: 'Admin (ผู้ดูแล)',
  accountant: 'Accountant (บัญชี)',
  technician: 'Technician (ช่าง)',
  designer: 'Designer (ช่างออกแบบ)',
}

const roleBadgeColors: Record<string, string> = {
  admin: '#6366f1',
  accountant: '#0ea5e9',
  technician: '#f59e0b',
  designer: '#ec4899',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<SupabaseUserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editUser, setEditUser] = useState<SupabaseUserItem | null>(null)
  const [addForm, setAddForm] = useState({ email: '', password: '', role: 'technician' })
  const [editRole, setEditRole] = useState('')

  const fetchUsers = async () => {
    try {
      const res = await adminApi.getUsers()
      const data = res.data?.users || res.data || []
      setUsers(Array.isArray(data) ? data : [])
    } catch {
      toast.error('โหลดรายชื่อผู้ใช้ไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleAdd = async () => {
    if (!addForm.email.trim() || !addForm.password.trim()) {
      toast.error('กรุณากรอก Email และ Password')
      return
    }
    try {
      await adminApi.createUser({
        email: addForm.email,
        password: addForm.password,
        role: addForm.role,
      })
      toast.success('สร้างผู้ใช้สำเร็จ')
      setShowAddModal(false)
      setAddForm({ email: '', password: '', role: 'technician' })
      fetchUsers()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { msg?: string } } })?.response?.data?.msg || 'สร้างผู้ใช้ไม่สำเร็จ'
      toast.error(msg)
    }
  }

  const handleUpdateRole = async () => {
    if (!editUser || !editRole) return
    try {
      await adminApi.updateUserRole(editUser.id, { role: editRole })
      toast.success('เปลี่ยน Role สำเร็จ')
      setEditUser(null)
      fetchUsers()
    } catch {
      toast.error('เปลี่ยน Role ไม่สำเร็จ')
    }
  }

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`ลบผู้ใช้ "${email}" จริงหรือ? การกระทำนี้ย้อนกลับไม่ได้`)) return
    try {
      await adminApi.deleteUser(id)
      toast.success('ลบผู้ใช้สำเร็จ')
      fetchUsers()
    } catch {
      toast.error('ลบผู้ใช้ไม่สำเร็จ')
    }
  }

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={22} /> จัดการผู้ใช้
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            สร้าง, แก้ไข, ลบ ผู้ใช้ในระบบ ({users.length} คน)
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)} id="add-user-btn">
          <Plus size={16} /> เพิ่มผู้ใช้
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>กำลังโหลด...</p>
        ) : users.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>ยังไม่มีผู้ใช้ในระบบ</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>สร้างเมื่อ</th>
                  <th style={{ textAlign: 'center' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => {
                  const role = u.app_metadata?.role || 'technician'
                  return (
                    <tr key={u.id}>
                      <td style={{ color: 'var(--text-muted)', width: 40 }}>{idx + 1}</td>
                      <td style={{ fontWeight: 500 }}>{u.email}</td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                          fontSize: 11, fontWeight: 600, color: 'white',
                          background: roleBadgeColors[role] || '#94a3b8',
                        }}>
                          {roleLabels[role] || role}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>{formatDate(u.created_at)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button className="btn btn-sm" onClick={() => { setEditUser(u); setEditRole(role) }} title="เปลี่ยน Role">
                            <Pencil size={14} />
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id, u.email)} title="ลบ">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h3 style={{ marginBottom: 20 }}>เพิ่มผู้ใช้ใหม่</h3>
            <div className="form-group">
              <label className="form-label">Email (Gmail)</label>
              <input
                id="new-user-email"
                className="form-input"
                type="email"
                value={addForm.email}
                onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                placeholder="user@gmail.com"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="new-user-password"
                className="form-input"
                type="text"
                value={addForm.password}
                onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                placeholder="ขั้นต่ำ 6 ตัวอักษร"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                id="new-user-role"
                className="form-input"
                value={addForm.role}
                onChange={e => setAddForm({ ...addForm, role: e.target.value })}
              >
                <option value="admin">Admin (ผู้ดูแล)</option>
                <option value="accountant">Accountant (บัญชี)</option>
                <option value="technician">Technician (ช่าง)</option>
                <option value="designer">Designer (ช่างออกแบบ)</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn" onClick={() => setShowAddModal(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleAdd} id="confirm-add-user">เพิ่มผู้ใช้</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 style={{ marginBottom: 20 }}>เปลี่ยน Role</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              ผู้ใช้: <strong>{editUser.email}</strong>
            </p>
            <div className="form-group">
              <label className="form-label">Role ใหม่</label>
              <select
                className="form-input"
                value={editRole}
                onChange={e => setEditRole(e.target.value)}
              >
                <option value="admin">Admin (ผู้ดูแล)</option>
                <option value="accountant">Accountant (บัญชี)</option>
                <option value="technician">Technician (ช่าง)</option>
                <option value="designer">Designer (ช่างออกแบบ)</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn" onClick={() => setEditUser(null)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleUpdateRole}>บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

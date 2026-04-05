import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, Package, ClipboardList, BarChart3, FileText,
  Building2, Users, TrendingUp, Printer, LogOut,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard', adminOnly: true },
  { to: '/record', icon: <ClipboardList size={18} />, label: 'บันทึกรายการ', adminOnly: false },
  { to: '/stock', icon: <Package size={18} />, label: 'สต็อกวัสดุ', adminOnly: false },
  { to: '/stats', icon: <BarChart3 size={18} />, label: 'สถิติรวม', adminOnly: true },
  { to: '/summary', icon: <TrendingUp size={18} />, label: 'สรุปรายวัน', adminOnly: true },
  { to: '/logs', icon: <FileText size={18} />, label: 'บันทึกกิจกรรม', adminOnly: true },
]
const adminItems = [
  { to: '/admin/branches', icon: <Building2 size={18} />, label: 'จัดการสาขา' },
  { to: '/admin/users', icon: <Users size={18} />, label: 'จัดการผู้ใช้' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  if (!user) return null

  const isAdmin = user.role === 'superadmin' || user.role === 'branch_admin'
  const allowedNav = navItems.filter(item => isAdmin || !item.adminOnly)

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1><Printer size={20} /> งานอิงค์เจ็ท</h1>
        <p>ระบบจัดการร้านป้าย</p>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-label">เมนูหลัก</div>
        {allowedNav.map(item => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            {item.icon}{item.label}
          </NavLink>
        ))}

        {user.role === 'superadmin' && (
          <>
            <div className="nav-section-label" style={{ marginTop: 8 }}>จัดการระบบ</div>
            {adminItems.map(item => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                {item.icon}{item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user.email[0].toUpperCase()}</div>
          <div className="user-details">
            <div className="user-name">{user.email}</div>
            <div className="user-role">{user.role}</div>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            width: '100%', padding: '8px 16px', marginTop: 8,
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 12,
          }}
        >
          <LogOut size={14} /> ออกจากระบบ
        </button>
      </div>
    </aside>
  )
}

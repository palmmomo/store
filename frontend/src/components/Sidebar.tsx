import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, Package, ClipboardList, BarChart3, FileText,
  Building2, Users, TrendingUp, Printer, LogOut, ShoppingCart, Menu, X
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard', roles: ['superadmin', 'admin'] },
  { to: '/record', icon: <ClipboardList size={18} />, label: 'บันทึกยอดขาย', roles: ['staff'] },
  { to: '/expenses', icon: <FileText size={18} />, label: 'รายจ่าย', roles: ['staff'] },
  { to: '/stock', icon: <Package size={18} />, label: 'สต็อกวัสดุ', roles: ['superadmin', 'admin', 'staff'] },
  { to: '/stats', icon: <BarChart3 size={18} />, label: 'สถิติรวม', roles: ['superadmin', 'admin'] },
  { to: '/summary', icon: <TrendingUp size={18} />, label: 'สรุปรายวัน', roles: ['superadmin', 'admin'] },
  { to: '/purchases', icon: <ShoppingCart size={18} />, label: 'ประวัติการจัดซื้อ', roles: ['superadmin', 'admin', 'staff'] },
  { to: '/quotation', icon: <FileText size={18} />, label: 'ใบเสนอราคา', roles: ['superadmin', 'admin', 'staff'] },
  { to: '/sales-history', icon: <TrendingUp size={18} />, label: 'ประวัติยอดขาย', roles: ['superadmin', 'admin', 'staff'] },
]
const adminItems = [
  { to: '/admin/branches', icon: <Building2 size={18} />, label: 'จัดการสาขา' },
  { to: '/admin/users', icon: <Users size={18} />, label: 'จัดการผู้ใช้' },
  { to: '/admin/expenses', icon: <FileText size={18} />, label: 'รายจ่ายทั้งหมด' },
  { to: '/admin/sales-history', icon: <TrendingUp size={18} />, label: 'ประวัติยอดขายทั้งหมด' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  if (!user) return null

  const allowedNav = navItems.filter(item => item.roles.includes(user.role))

  const handleNavClick = () => setMobileOpen(false)

  return (
    <>
      {/* Mobile hamburger button */}
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} aria-label="เปิดเมนู">
        <Menu size={20} />
      </button>

      {/* Overlay backdrop */}
      <div
        className={`sidebar-overlay${mobileOpen ? ' mobile-open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1><Printer size={20} /> งานอิงค์เจ็ท</h1>
            <p>ระบบจัดการร้านป้าย</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'none' }}
            className="sidebar-close-btn"
            aria-label="ปิดเมนู"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">เมนูหลัก</div>
          {allowedNav.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={handleNavClick}>
              {item.icon}{item.label}
            </NavLink>
          ))}

          {user.role === 'superadmin' && (
            <>
              <div className="nav-section-label" style={{ marginTop: 8 }}>จัดการระบบ</div>
              {adminItems.map(item => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={handleNavClick}>
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
    </>
  )
}

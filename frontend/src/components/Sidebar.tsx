import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Building2,
  ClipboardList,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
  roles?: string[]
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/pos', icon: <ShoppingCart size={18} />, label: 'POS ขายสินค้า' },
  { to: '/stock', icon: <Package size={18} />, label: 'สต็อกสินค้า' },
  { to: '/orders', icon: <ClipboardList size={18} />, label: 'รายการออเดอร์', roles: ['superadmin', 'branch_admin'] },
  { to: '/stats', icon: <BarChart3 size={18} />, label: 'สถิติยอดขาย', roles: ['superadmin', 'branch_admin'] },
  { to: '/summary', icon: <TrendingUp size={18} />, label: 'สรุปรายรับ', roles: ['superadmin', 'branch_admin'] },
  { to: '/logs', icon: <FileText size={18} />, label: 'บันทึกกิจกรรม', roles: ['superadmin', 'branch_admin'] },
]

const adminItems: NavItem[] = [
  { to: '/admin/branches', icon: <Building2 size={18} />, label: 'จัดการสาขา' },
  { to: '/admin/users', icon: <Settings size={18} />, label: 'จัดการผู้ใช้' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const canView = (item: NavItem) => {
    if (!item.roles) return true
    return item.roles.includes(user?.role || '')
  }

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U'

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>🍽️ ร้านอาหาร</h1>
        <p>ระบบจัดการร้านค้า</p>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">เมนูหลัก</div>
        {navItems.filter(canView).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}

        {(user?.role === 'superadmin' || user?.role === 'branch_admin') && (
          <>
            <div className="nav-section-label" style={{ marginTop: 8 }}>จัดการระบบ</div>
            {adminItems.map((item) => (
              (item.to !== '/admin/branches' || user?.role === 'superadmin') && (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              )
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{userInitial}</div>
          <div className="user-details">
            <div className="user-name">{user?.email}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="ออกจากระบบ">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}

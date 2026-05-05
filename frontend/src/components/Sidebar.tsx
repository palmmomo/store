import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, Package, ShoppingCart, PackageMinus,
  FileText, Building2, KanbanSquare, Users, Printer, LogOut, Menu, X
} from 'lucide-react'

const roleLabels: Record<string, string> = { admin: 'Admin', accountant: 'บัญชี', technician: 'ช่าง', designer: 'ช่างออกแบบ' }

export default function Sidebar() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  if (!user) return null
  const close = () => setMobileOpen(false)

  type NavItem = { to: string; icon: React.ReactNode; label: string }
  const mainItems: NavItem[] = []
  const systemItems: NavItem[] = []

  if (user.role === 'admin') {
    mainItems.push(
      { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
      { to: '/stock', icon: <Package size={18} />, label: 'Stock' },
      { to: '/quotation', icon: <FileText size={18} />, label: 'ใบเสนอราคา' },
      { to: '/jobs', icon: <KanbanSquare size={18} />, label: 'การดำเนินงาน' },
    )
    systemItems.push(
      { to: '/branches', icon: <Building2 size={18} />, label: 'สาขา' },
      { to: '/admin/users', icon: <Users size={18} />, label: 'จัดการผู้ใช้' },
    )
  } else if (user.role === 'accountant') {
    mainItems.push(
      { to: '/purchase', icon: <ShoppingCart size={18} />, label: 'ซื้อของเข้า' },
      { to: '/quotation', icon: <FileText size={18} />, label: 'ใบเสนอราคา' },
      { to: '/jobs', icon: <KanbanSquare size={18} />, label: 'การดำเนินงาน' },
    )
  } else if (user.role === 'technician') {
    mainItems.push(
      { to: '/withdraw', icon: <PackageMinus size={18} />, label: 'เบิกของ' },
      { to: '/jobs', icon: <KanbanSquare size={18} />, label: 'การดำเนินงาน' },
    )
  }
    else if (user.role === 'designer') {
      mainItems.push(
      { to: '/jobs', icon: <KanbanSquare size={18} />, label: 'การดำเนินงาน' },
    )
  }

  const renderNav = (items: NavItem[]) => items.map(i => (
    <NavLink key={i.to} to={i.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={close}>
      {i.icon}{i.label}
    </NavLink>
  ))

  return (
    <>
      {!mobileOpen && <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} aria-label="เปิดเมนู"><Menu size={20} /></button>}
      {mobileOpen && <div className="sidebar-overlay mobile-open" onClick={close} style={{ cursor: 'pointer' }} />}
      <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h1><Printer size={20} /> งานอิงค์เจ็ท</h1><p>ระบบจัดการร้านป้าย</p></div>
          <button onClick={close} className="sidebar-close-btn" aria-label="ปิดเมนู" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">เมนูหลัก</div>
          {renderNav(mainItems)}
          {systemItems.length > 0 && <>
            <div className="nav-section-label" style={{ marginTop: 8 }}>จัดการระบบ</div>
            {renderNav(systemItems)}
          </>}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info"><div className="user-avatar">{user.email[0].toUpperCase()}</div>
            <div className="user-details"><div className="user-name">{user.email}</div><div className="user-role">{roleLabels[user.role] || user.role}</div></div></div>
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '8px 16px', marginTop: 8, background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12 }}>
            <LogOut size={14} /> ออกจากระบบ
          </button>
        </div>
      </aside>
    </>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminStockPage from './pages/AdminStockPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AccountantPurchasePage from './pages/AccountantPurchasePage'
import TechnicianWithdrawPage from './pages/TechnicianWithdrawPage'
import BranchesPage from './pages/BranchesPage'
import QuotationPage from './pages/QuotationPage'
import JobsPage from './pages/JobsPage'

function ProtectedLayout() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><p style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p></div>
  if (!user) return <Navigate to="/login" replace />

  const defaultPath = user.role === 'admin' ? '/dashboard' : user.role === 'accountant' ? '/purchase' : '/withdraw'
  const isAdmin = user.role === 'admin'
  const isAccountant = user.role === 'accountant'
  const isTechnician = user.role === 'technician'

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content"><div className="page-content">
        <Routes>
          <Route path="/dashboard" element={isAdmin ? <AdminDashboardPage /> : <Navigate to={defaultPath} />} />
          <Route path="/stock" element={isAdmin ? <AdminStockPage /> : <Navigate to={defaultPath} />} />
          <Route path="/admin/users" element={isAdmin ? <AdminUsersPage /> : <Navigate to={defaultPath} />} />
          <Route path="/branches" element={isAdmin ? <BranchesPage /> : <Navigate to={defaultPath} />} />
          <Route path="/purchase" element={(isAdmin || isAccountant) ? <AccountantPurchasePage /> : <Navigate to={defaultPath} />} />
          <Route path="/withdraw" element={(isAdmin || isTechnician) ? <TechnicianWithdrawPage /> : <Navigate to={defaultPath} />} />
          <Route path="/quotation" element={(isAdmin || isAccountant) ? <QuotationPage /> : <Navigate to={defaultPath} />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="*" element={<Navigate to={defaultPath} replace />} />
        </Routes>
      </div></div>
    </div>
  )
}

function AppRoutes() {
  const { user } = useAuth()
  return <Routes><Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} /><Route path="/*" element={<ProtectedLayout />} /></Routes>
}

export default function App() {
  return <BrowserRouter><AuthProvider><Toaster position="top-right" /><AppRoutes /></AuthProvider></BrowserRouter>
}

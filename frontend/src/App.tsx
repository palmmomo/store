import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import RecordPage from './pages/RecordPage'
import StockPage from './pages/StockPage'
import PurchasesPage from './pages/PurchasesPage'
import StatsPage from './pages/StatsPage'
import SummaryPage from './pages/SummaryPage'
import LogsPage from './pages/LogsPage'
import BranchManagePage from './pages/admin/BranchManagePage'
import UsersPage from './pages/admin/UsersPage'

function ProtectedLayout() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  const isAdmin = user.role === 'superadmin' || user.role === 'branch_admin'
  const defaultPath = isAdmin ? '/dashboard' : '/stock'

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-content">
          <Routes>
            <Route path="/dashboard" element={isAdmin ? <DashboardPage /> : <Navigate to={defaultPath} />} />
            <Route path="/record" element={<RecordPage />} />
            <Route path="/stock" element={<StockPage />} />
            <Route path="/purchases" element={<PurchasesPage />} />
            <Route path="/stats" element={isAdmin ? <StatsPage /> : <Navigate to={defaultPath} />} />
            <Route path="/summary" element={isAdmin ? <SummaryPage /> : <Navigate to={defaultPath} />} />
            <Route path="/logs" element={isAdmin ? <LogsPage /> : <Navigate to={defaultPath} />} />
            <Route path="/admin/branches" element={user.role === 'superadmin' ? <BranchManagePage /> : <Navigate to={defaultPath} />} />
            <Route path="/admin/users" element={user.role === 'superadmin' ? <UsersPage /> : <Navigate to={defaultPath} />} />
            <Route path="*" element={<Navigate to={defaultPath} replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

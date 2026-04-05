import { useState, useEffect } from 'react'
import { branchApi, statsApi } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import {
  ArrowUpRight, ArrowDownLeft, DollarSign, Calendar, Receipt, AlertTriangle,
} from 'lucide-react'

const fmt = (v: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(v)

interface DashboardData {
  total_revenue: number
  total_orders: number
  total_products: number
  low_stock_count: number
  revenue_today: number
  orders_today: number
}

interface Branch {
  id: string
  name: string
  address: string
  phone: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardData | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, branchRes] = await Promise.all([
          statsApi.getDashboard(),
          branchApi.getAll(),
        ])
        setStats(statsRes.data)
        setBranches(Array.isArray(branchRes.data) ? branchRes.data : [])
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: 24 }}>กำลังโหลดข้อมูล...</p>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">ภาพรวมร้าน — {user?.email}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
          <Calendar size={14} /> {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon green"><ArrowUpRight size={20} /></div>
            <div><div className="stat-label">รายรับวันนี้</div><div className="stat-value" style={{ color: 'var(--success)' }}>{fmt(stats.revenue_today)}</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red"><ArrowDownLeft size={20} /></div>
            <div><div className="stat-label">รายรับรวม</div><div className="stat-value">{fmt(stats.total_revenue)}</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><DollarSign size={20} /></div>
            <div><div className="stat-label">คำสั่งซื้อวันนี้</div><div className="stat-value">{stats.orders_today}</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"><Receipt size={20} /></div>
            <div><div className="stat-label">สินค้าทั้งหมด</div><div className="stat-value">{stats.total_products}</div></div>
          </div>
        </div>
      )}

      {stats && stats.low_stock_count > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)' }}>
            <AlertTriangle size={16} color="var(--warning)" />
            <span style={{ fontSize: 13 }}>สต็อกต่ำกว่ากำหนด {stats.low_stock_count} รายการ</span>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header"><span className="card-title">สาขาทั้งหมด ({branches.length})</span></div>
        <div className="table-wrapper" style={{ boxShadow: 'none', border: 'none', padding: 0 }}>
          <table style={{ margin: 0 }}>
            <thead><tr><th>ชื่อสาขา</th><th>ที่อยู่</th><th>เบอร์โทร</th></tr></thead>
            <tbody>
              {branches.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.name}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{b.address || '-'}</td>
                  <td style={{ fontSize: 13 }}>{b.phone || '-'}</td>
                </tr>
              ))}
              {branches.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>ยังไม่มีข้อมูลสาขา</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

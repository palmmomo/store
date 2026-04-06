import { useState, useEffect } from 'react'
import { branchApi, statsApi } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import {
  ArrowUpRight, ArrowDownLeft, DollarSign, Calendar, AlertTriangle,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

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
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, branchRes, chartRes] = await Promise.all([
          statsApi.getDashboard(),
          branchApi.getAll(),
          statsApi.getChart('')
        ])
        setStats(statsRes.data)
        setBranches(Array.isArray(branchRes.data) ? branchRes.data : [])
        const fullChart = Array.isArray(chartRes.data) ? chartRes.data : []
        // get last 7 days only
        setChartData(fullChart.slice(-7))
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
            <div className="stat-icon green"><ArrowUpRight size={20} /></div>
            <div><div className="stat-label">รายรับรวม</div><div className="stat-value">{fmt(stats.total_revenue)}</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red"><ArrowDownLeft size={20} /></div>
            <div><div className="stat-label">ค่าสั่งซื้อวันนี้</div><div className="stat-value" style={{ color: 'var(--danger)' }}>{fmt((stats as any).expenses_today || 0)}</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><DollarSign size={20} /></div>
            <div><div className="stat-label">กำไรโดยประมาณ</div><div className="stat-value">{fmt((stats as any).est_profit || 0)}</div></div>
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

      {chartData.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 20, fontSize: 16 }}>รายรับย้อนหลัง 7 วัน</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dx={-10} tickFormatter={v => '฿' + (v >= 1000 ? (v/1000) + 'k' : v)} />
                <Tooltip 
                  formatter={(value: any) => [fmt(value as number), 'รายรับ']}
                  labelStyle={{ color: '#000', fontWeight: 'bold' }} 
                />
                <Line type="monotone" dataKey="revenue" name="รายรับ" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header"><span className="card-title">สรุปสาขาทั้งหมด ({branches.length})</span></div>
        <div className="table-wrapper" style={{ boxShadow: 'none', border: 'none', padding: 0 }}>
          <table style={{ margin: 0 }}>
            <thead><tr><th>สาขา</th><th style={{textAlign: 'right'}}>ยอดวันนี้</th><th style={{textAlign: 'center'}}>สต๊อกวิกฤต</th></tr></thead>
            <tbody>
              {branches.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.name}</td>
                  <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>-</td>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>-</td>
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

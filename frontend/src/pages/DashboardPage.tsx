import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, ShoppingCart, Package, AlertTriangle, DollarSign, BarChart2 } from 'lucide-react'
import { statsApi } from '../api/client'
import type { DashboardStats, SalesChartData } from '../types'

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(v)

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chart, setChart] = useState<SalesChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, cRes] = await Promise.all([statsApi.getDashboard(), statsApi.getChart()])
        setStats(sRes.data)
        setChart(cRes.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>

  const statCards = [
    { label: 'รายได้ทั้งหมด', value: formatCurrency(stats?.total_revenue || 0), icon: <DollarSign size={22} />, color: 'green' },
    { label: 'ออเดอร์ทั้งหมด', value: (stats?.total_orders || 0).toLocaleString(), icon: <ShoppingCart size={22} />, color: 'purple' },
    { label: 'สินค้าทั้งหมด', value: (stats?.total_products || 0).toLocaleString(), icon: <Package size={22} />, color: 'blue' },
    { label: 'สต็อกต่ำกว่ากำหนด', value: (stats?.low_stock_count || 0).toString(), icon: <AlertTriangle size={22} />, color: 'red' },
    { label: 'รายได้วันนี้', value: formatCurrency(stats?.revenue_today || 0), icon: <TrendingUp size={22} />, color: 'green' },
    { label: 'ออเดอร์วันนี้', value: (stats?.orders_today || 0).toString(), icon: <BarChart2 size={22} />, color: 'yellow' },
  ]

  // Format chart dates to Thai short format
  const chartData = chart.map((d) => ({
    ...d,
    dateLabel: new Date(d.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
  }))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">ภาพรวมธุรกิจวันนี้</p>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div className="stat-content">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">ยอดขาย 30 วันล่าสุด</span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false}
              tickFormatter={(v) => `฿${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(v: any) => [formatCurrency(v as number), 'รายได้']}
            />
            <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">จำนวนออเดอร์ 30 วันล่าสุด</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(v: any) => [v, 'ออเดอร์']}
              />
              <Bar dataKey="orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

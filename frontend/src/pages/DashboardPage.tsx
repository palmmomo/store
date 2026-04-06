import { useState, useEffect } from 'react'
import { branchApi, statsApi, stockApi, orderApi } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import {
  TrendingUp, TrendingDown, DollarSign, Calendar, AlertTriangle, CheckCircle2,
  Package, Receipt
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const fmt = (v: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(v || 0)

interface DashboardStats {
  revenue_today: number
  revenue_month: number
  expenses_month: number
  est_profit: number
  low_stock_count: number
}

interface Branch {
  id: string
  name: string
}

interface BranchSummary {
  id: string
  name: string
  todaySales: number
  criticalStock: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    revenue_today: 0,
    revenue_month: 0,
    expenses_month: 0,
    est_profit: 0,
    low_stock_count: 0
  })
  const [branches, setBranches] = useState<Branch[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [branchSummaries, setBranchSummaries] = useState<BranchSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        let statsData: any = {}
        let branchesData: any[] = []
        let chartDataRaw: any[] = []
        let stocksData: any[] = []
        let ordersData: any[] = []

        try {
          const statsRes = await statsApi.getDashboard()
          statsData = statsRes?.data || {}
        } catch (e) {
          console.log('Stats API not available')
        }

        try {
          const branchRes = await branchApi.getAll()
          branchesData = Array.isArray(branchRes?.data) ? branchRes.data : []
        } catch (e) {
          console.log('Branch API not available')
        }

        try {
          const chartRes = await statsApi.getChart('')
          chartDataRaw = Array.isArray(chartRes?.data) ? chartRes.data : []
        } catch (e) {
          console.log('Chart API not available')
        }

        try {
          const stockRes = await stockApi.getAll()
          stocksData = stockRes?.data?.data || stockRes?.data || []
        } catch (e) {
          console.log('Stock API not available')
        }

        try {
          const ordersRes = await orderApi.getAll()
          ordersData = ordersRes?.data || []
        } catch (e) {
          console.log('Orders API not available')
        }

        setStats({
          revenue_today: statsData?.revenue_today || 0,
          revenue_month: statsData?.total_revenue || 0,
          expenses_month: statsData?.expenses_month || 0,
          est_profit: (statsData?.total_revenue || 0) - (statsData?.expenses_month || 0),
          low_stock_count: statsData?.low_stock_count || 0
        })

        setBranches(branchesData)
        setChartData(chartDataRaw.slice(-7))

        const today = new Date().toISOString().split('T')[0]
        
        const summaries: BranchSummary[] = branchesData.map((branch: any) => {
          const todayOrders = ordersData.filter((o: any) => {
            const orderDate = o?.created_at ? new Date(o.created_at).toISOString().split('T')[0] : ''
            return o?.branch_id === branch.id && orderDate === today
          })
          const todaySales = todayOrders.reduce((sum: number, o: any) => sum + (o?.total || 0), 0)
          
          const branchStocks = stocksData.filter((s: any) => s?.branch_id === branch.id)
          const criticalStock = branchStocks.filter((s: any) => {
            const minLevel = s?.min_stock_level || s?.MinStockLevel || 0
            const currentStock = s?.current_stock || s?.CurrentStock || 0
            return minLevel > 0 && currentStock <= minLevel
          }).length
          
          return {
            id: branch.id,
            name: branch.name,
            todaySales,
            criticalStock
          }
        })
        
        setBranchSummaries(summaries)
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <p style={{ color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">ภาพรวมร้าน — {user?.email || '-'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
          <Calendar size={14} /> {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, opacity: 0.9 }}>รายรับวันนี้</span>
            <TrendingUp size={20} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{fmt(stats.revenue_today)}</div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, opacity: 0.9 }}>รายรับรวมเดือนนี้</span>
            <Receipt size={20} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{fmt(stats.revenue_month)}</div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, opacity: 0.9 }}>รายจ่ายเดือนนี้</span>
            <TrendingDown size={20} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{fmt(stats.expenses_month)}</div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, opacity: 0.9 }}>กำไรโดยประมาณ</span>
            <DollarSign size={20} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{fmt(stats.est_profit)}</div>
        </div>
      </div>

      {stats.low_stock_count > 0 && (
        <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid var(--warning)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
            <div style={{ 
              width: 40, height: 40, borderRadius: '50%', background: 'var(--warning-bg)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <AlertTriangle size={20} color="var(--warning)" />
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>สต็อกต่ำกว่ากำหนด</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>มี {stats.low_stock_count} รายการที่ต้องสั่งซื้อเพิ่ม</div>
            </div>
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 20, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} /> รายรับย้อนหลัง 7 วัน
          </h3>
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

      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Package size={18} />
          <span className="card-title">สรุปสาขาทั้งหมด ({branches.length})</span>
        </div>
        <div className="table-wrapper" style={{ boxShadow: 'none', border: 'none', padding: 0 }}>
          <table style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>สาขา</th>
                <th style={{ textAlign: 'right' }}>ยอดวันนี้</th>
                <th style={{ textAlign: 'center' }}>สต๊อกวิกฤต</th>
              </tr>
            </thead>
            <tbody>
              {branchSummaries.map((b, idx) => (
                <tr key={b.id} style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary)' }}>
                  <td style={{ fontWeight: 600 }}>{b.name}</td>
                  <td style={{ textAlign: 'right', fontWeight: 500, color: b.todaySales > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                    {fmt(b.todaySales)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {b.criticalStock > 0 ? (
                      <span style={{ color: 'var(--danger)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <AlertTriangle size={14} />
                        {b.criticalStock} รายการ
                      </span>
                    ) : (
                      <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <CheckCircle2 size={14} />
                        ปกติ
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {branchSummaries.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                    <Package size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <div>ยังไม่มีข้อมูลสาขา</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

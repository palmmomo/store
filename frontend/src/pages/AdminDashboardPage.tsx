import { useState, useEffect } from 'react'
import { dashboardApi } from '../api/client'
import { LayoutDashboard, TrendingUp, ShoppingCart, Wallet } from 'lucide-react'

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState({ total_revenue: 0, total_purchase: 0, net_profit: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await dashboardApi.getSummary()
        setSummary(res.data)
      } catch { /* ignore if endpoint not ready */ }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  const fmtNum = (n: number) => n?.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'

  const cards = [
    { label: 'รายได้จากงาน', sub: 'รวม jobs.price ทั้งหมด', value: summary.total_revenue, icon: <TrendingUp size={24} />, color: '#10b981', bg: '#ecfdf5' },
    { label: 'ค่าซื้อวัสดุ', sub: 'รวม stock_purchases.total_price', value: summary.total_purchase, icon: <ShoppingCart size={24} />, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'กำไรสุทธิ (ประมาณ)', sub: 'รายได้ - ค่าวัสดุ', value: summary.net_profit, icon: <Wallet size={24} />, color: summary.net_profit >= 0 ? '#10b981' : '#ef4444', bg: summary.net_profit >= 0 ? '#ecfdf5' : '#fef2f2' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><LayoutDashboard size={22} /> Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>ภาพรวมการเงินร้านป้าย</p>
        </div>
      </div>

      {loading ? (
        <div className="card"><p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>กำลังโหลด...</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {cards.map((c, i) => (
            <div key={i} className="card" style={{ padding: 20, borderLeft: `4px solid ${c.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: c.color }}>฿{fmtNum(c.value)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{c.sub}</div>
                </div>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color }}>
                  {c.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

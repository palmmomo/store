import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { statsApi } from '../api/client'
import type { SalesChartData } from '../types'

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(v)

export default function StatsPage() {
  const [chart, setChart] = useState<SalesChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    statsApi.getChart().then((r) => { setChart(r.data); setLoading(false) })
  }, [])

  const chartData = chart.map((d) => ({
    ...d,
    dateLabel: new Date(d.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
  }))

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">สถิติยอดขาย</h1>
          <p className="page-subtitle">ข้อมูลยอดขาย 30 วันล่าสุด</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">รายได้รายวัน (บาท)</span></div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false}
                tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
                formatter={(v: any) => [formatCurrency(v as number), 'รายได้']}
              />
              <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">จำนวนออเดอร์รายวัน</span></div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
                formatter={(v: any) => [v, 'ออเดอร์']}
              />
              <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">สรุปตัวเลข (30 วัน)</span></div>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>วันที่</th>
                <th style={{ textAlign: 'right' }}>ออเดอร์</th>
                <th style={{ textAlign: 'right' }}>รายได้</th>
              </tr>
            </thead>
            <tbody>
              {[...chartData].reverse().map((d, i) => (
                <tr key={i}>
                  <td>{d.dateLabel}</td>
                  <td style={{ textAlign: 'right' }}>{d.orders}</td>
                  <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 500 }}>{formatCurrency(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

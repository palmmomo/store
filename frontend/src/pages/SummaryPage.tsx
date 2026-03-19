import { useEffect, useState } from 'react'
import { statsApi } from '../api/client'
import { TrendingUp } from 'lucide-react'

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(v)

export default function SummaryPage() {
  const [data, setData] = useState<any>(null)
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month')
  const [loading, setLoading] = useState(false)

  const load = async (p: 'day' | 'week' | 'month') => {
    setLoading(true)
    try {
      const r = await statsApi.getSummary(undefined, p)
      setData(r.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(period) }, [period])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">สรุปรายรับ</h1>
          <p className="page-subtitle">รายได้แยกตามช่วงเวลา</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['day', 'week', 'month'] as const).map((p) => (
            <button key={p} className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPeriod(p)}>
              {p === 'day' ? 'วันนี้' : p === 'week' ? '7 วัน' : '30 วัน'}
            </button>
          ))}
        </div>
      </div>

      {loading
        ? <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>
        : data && (
          <>
            <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 24 }}>
              <div className="stat-card">
                <div className="stat-icon green"><TrendingUp size={22} /></div>
                <div>
                  <div className="stat-label">รายได้รวม</div>
                  <div className="stat-value" style={{ fontSize: 22 }}>{formatCurrency(data.total_revenue)}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon purple"><TrendingUp size={22} /></div>
                <div>
                  <div className="stat-label">จำนวนออเดอร์</div>
                  <div className="stat-value">{data.total_orders}</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">รายการออเดอร์</span></div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>เลขออเดอร์</th>
                      <th>วันเวลา</th>
                      <th>สถานะ</th>
                      <th style={{ textAlign: 'right' }}>ยอด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.orders || []).map((o: any) => (
                      <tr key={o.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{o.id?.slice(0, 8)}...</td>
                        <td style={{ fontSize: 13 }}>{new Date(o.created_at).toLocaleString('th-TH')}</td>
                        <td><span className="badge badge-success">สำเร็จ</span></td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(o.total)}</td>
                      </tr>
                    ))}
                    {!data.orders?.length && (
                      <tr><td colSpan={4}><div className="empty-state"><p>ไม่มีข้อมูล</p></div></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
    </div>
  )
}

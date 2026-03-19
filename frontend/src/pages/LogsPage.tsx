import { useEffect, useState } from 'react'
import { stockApi } from '../api/client'
import { StockLog } from '../types'
import { FileText, TrendingUp, TrendingDown } from 'lucide-react'

export default function LogsPage() {
  const [logs, setLogs] = useState<StockLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    stockApi.getLogs().then((r) => { setLogs(r.data); setLoading(false) })
  }, [])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">บันทึกกิจกรรม</h1>
          <p className="page-subtitle">Log การเปลี่ยนแปลงสต็อกทั้งหมด</p>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>วันเวลา</th>
              <th>สินค้า</th>
              <th>การเปลี่ยนแปลง</th>
              <th>เหตุผล</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(log.created_at).toLocaleString('th-TH')}</td>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{log.products?.name || log.product_id}</td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600,
                    color: log.change >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {log.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {log.change >= 0 ? '+' : ''}{log.change}
                  </span>
                </td>
                <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{log.reason}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={4}><div className="empty-state"><FileText /><p>ไม่มีบันทึกกิจกรรม</p></div></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { statsApi, branchApi } from '../api/client'
import { Calendar, Download } from 'lucide-react'

// Dummy type for now, replace with actual response structure
interface SummaryData {
  summary: {
    total_revenue: number
    cash_total: number
    transfer_total: number
    order_count: number
    materials_used: number
  }
}

interface Branch {
  id: string
  name: string
}

export default function SummaryPage() {
  const [data, setData] = useState<SummaryData | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [period, setPeriod] = useState<string>('today')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [sumRes, branchRes] = await Promise.all([
          statsApi.getSummary(selectedBranch, period),
          branchApi.getAll(),
        ])
        setData(sumRes.data)
        setBranches(Array.isArray(branchRes.data) ? branchRes.data : [])
      } catch (err) {
        console.error('Failed to load summary', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedBranch, period])

  const fmt = (v: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(v || 0)

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div><h1 className="page-title">สรุปรายงาน</h1><p className="page-subtitle">แสดงยอดขายและวัสดุที่ใช้ตามช่วงเวลา</p></div>
        <button className="btn btn-secondary" disabled><Download size={16} /> Export PDF</button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 12 }}>ช่วงเวลา</label>
            <select className="form-input" value={period} onChange={e => setPeriod(e.target.value)}>
              <option value="today">วันนี้</option>
              <option value="yesterday">เมื่อวาน</option>
              <option value="this_week">สัปดาห์นี้</option>
              <option value="this_month">เดือนนี้</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 12 }}>สาขา</label>
            <select className="form-input" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
              <option value="">-- รวมทุกสาขา --</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p>
      ) : data?.summary ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 4 }}>ยอดขายรวม (Total Sales)</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(data.summary.total_revenue)}</div>
            </div>
            <div className="stat-icon green" style={{ width: 64, height: 64 }}><Calendar size={28} /></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card">
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 4 }}>เงินสด</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--success)' }}>{fmt(data.summary.cash_total)}</div>
            </div>
            <div className="card">
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 4 }}>เงินโอน</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--info)' }}>{fmt(data.summary.transfer_total)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card">
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 4 }}>จำนวนบิล / งานพิมพ์</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{data.summary.order_count || 0} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>บิล</span></div>
            </div>
            <div className="card">
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 4 }}>วัสดุถูกเบิกใช้งาน (ครั้ง)</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{data.summary.materials_used || 0} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>รายการ</span></div>
            </div>
          </div>
        </div>
      ) : (
        <p style={{ color: 'var(--text-muted)' }}>ไม่มีข้อมูลสำหรับช่วงเวลานี้</p>
      )}
    </div>
  )
}

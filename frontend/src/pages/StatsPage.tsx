import { useState, useEffect } from 'react'
import { statsApi, branchApi } from '../api/client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts'

interface ChartData {
  date: string
  revenue: number
  orders: number
}

interface Branch {
  id: string
  name: string
}

export default function StatsPage() {
  const [data, setData] = useState<ChartData[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [chartRes, branchRes] = await Promise.all([
          statsApi.getChart(selectedBranch),
          branchApi.getAll()
        ])
        setData(Array.isArray(chartRes.data) ? chartRes.data : [])
        setBranches(Array.isArray(branchRes.data) ? branchRes.data : [])
      } catch (err) {
        console.error('Failed to load chart data', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedBranch])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#fff', border: '1px solid #eee', padding: 10, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600 }}>{label}</p>
          {payload.map((p: any, i: number) => (
            <div key={i} style={{ color: p.color, fontSize: 13, marginBottom: 4 }}>
              {p.name}: {p.name === 'รายรับ' ? p.value.toLocaleString('th-TH') + ' บาท' : p.value}
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">สถิติรวม 30 วัน</h1><p className="page-subtitle">แสดงข้อมูลรายรับและจำนวนงาน</p></div>
        <select className="form-input" style={{ width: 200 }} value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
          <option value="">-- ทุกสาขา --</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>กำลังโหลดกราฟ...</p>
      ) : (
        <div style={{ display: 'grid', gap: 24 }}>
          
          <div className="card">
            <h3 style={{ marginBottom: 24, fontSize: 16 }}>แนวโน้มรายรับประจำวัน</h3>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dx={-10} tickFormatter={v => '฿' + (v >= 1000 ? (v/1000) + 'k' : v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="revenue" name="รายรับ" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 24, fontSize: 16 }}>จำนวนงานรายวัน</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dx={-10} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-secondary)' }} />
                  <Bar dataKey="orders" name="จำนวนงาน" fill="var(--info)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { adminApi, branchApi } from '../api/client'
import { History, Package, User } from 'lucide-react'

interface LogEntry {
  id: string
  action: string
  description: string
  user_email?: string
  branch_name?: string
  created_at: string
}

interface Branch {
  id: string
  name: string
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const [logsRes, branchRes] = await Promise.all([
        adminApi.getLogs(selectedBranch),
        branchApi.getAll(),
      ])
      setLogs(Array.isArray(logsRes.data) ? logsRes.data : [])
      setBranches(Array.isArray(branchRes.data) ? branchRes.data : [])
    } catch (err) {
      console.error('Failed to load logs', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [selectedBranch])

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">บันทึกกิจกรรมระบบ</h1><p className="page-subtitle">แสดงประวัติการใช้งานล่าสุด</p></div>
        <select className="form-input" style={{ width: 200 }} value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
          <option value="">-- รวมทุกสาขา --</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: 'var(--danger)', marginBottom: 16 }}>ไม่สามารถโหลดข้อมูลได้ในขณะนี้</p>
            <button className="btn btn-primary" onClick={load}>ลองใหม่</button>
          </div>
        ) : logs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>ไม่มีข้อมูลกิจกรรม</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {logs.map((log) => (
              <div key={log.id} style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                  {log.action.includes('stock') ? <Package size={18} /> : log.action.includes('user') ? <User size={18} /> : <History size={18} />}
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>{log.description}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4, display: 'flex', gap: 12 }}>
                    <span>{new Date(log.created_at).toLocaleString('th-TH')}</span>
                    {log.user_email && <span>ผู้ทำรายการ: {log.user_email}</span>}
                    {log.branch_name && <span>สาขา: {log.branch_name}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

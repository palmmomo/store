import { useState, useEffect } from 'react'
import { stockApi, branchApi } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { 
  ArrowUpRight, ArrowDownLeft, Package, Building2, Calendar,
  ShoppingCart, AlertTriangle
} from 'lucide-react'

interface PurchaseRecord {
  id: number
  material_name: string
  quantity: number
  unit: string
  total_price: number
  store_name: string
  purchase_date: string
  branch_id: string
  branch_name?: string
}

interface UsageRecord {
  id: number
  material_name: string
  quantity_used: number
  unit: string
  notes: string
  usage_date: string
  user_email?: string
  branch_id: string
  branch_name?: string
}

export default function PurchaseHistoryPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming')
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([])
  const [usages, setUsages] = useState<UsageRecord[]>([])
  const [branches, setBranches] = useState<{id: string, name: string}[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin'

  useEffect(() => {
    if (isAdmin) {
      branchApi.getAll().then(res => {
        const data = res?.data || []
        setBranches(data)
      }).catch(() => setBranches([]))
    }
  }, [isAdmin])

  useEffect(() => {
    loadData()
  }, [activeTab, selectedBranch])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'incoming') {
        // Try to fetch purchase history - fallback to empty if API not ready
        try {
          const res = await stockApi.getPurchaseHistory?.(selectedBranch || undefined)
          const data = res?.data || []
          setPurchases(Array.isArray(data) ? data : [])
        } catch (e) {
          console.log('Purchase history API not available yet')
          setPurchases([])
        }
      } else {
        // Try to fetch usage history - fallback to empty if API not ready
        try {
          const res = await stockApi.getUsageHistory?.(selectedBranch || undefined)
          const data = res?.data || []
          setUsages(Array.isArray(data) ? data : [])
        } catch (e) {
          console.log('Usage history API not available yet')
          setUsages([])
        }
      }
    } catch (err) {
      console.error('Load data error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear() + 543
    return `${day}/${month}/${year}`
  }

  const formatAmount = (amount: number) => {
    return (amount || 0).toLocaleString('th-TH')
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Package size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            ประวัติการจัดซื้อ
          </h1>
          <p className="page-subtitle">
            ดูประวัติของเข้าและของออกจากสต็อก
          </p>
        </div>
      </div>

      {/* Branch Filter for Admin */}
      {isAdmin && (
        <div className="card" style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Building2 size={18} color="var(--primary)" />
            <label style={{ fontWeight: 500 }}>เลือกสาขา:</label>
            <select 
              className="form-input" 
              style={{ width: 250, marginBottom: 0 }} 
              value={selectedBranch} 
              onChange={e => setSelectedBranch(e.target.value)}
            >
              <option value="">-- ทุกสาขา --</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button 
          onClick={() => setActiveTab('incoming')}
          style={{ 
            flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
            background: activeTab === 'incoming' ? 'var(--success)' : 'var(--bg-card)',
            color: activeTab === 'incoming' ? 'white' : 'var(--text)',
            border: '1px solid', borderColor: activeTab === 'incoming' ? 'var(--success)' : 'var(--border)',
            borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', transition: '0.2s'
          }}
        >
          <ArrowUpRight size={18} /> ของเข้า (รับวัสดุ)
        </button>
        <button 
          onClick={() => setActiveTab('outgoing')}
          style={{ 
            flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
            background: activeTab === 'outgoing' ? 'var(--danger)' : 'var(--bg-card)',
            color: activeTab === 'outgoing' ? 'white' : 'var(--text)',
            border: '1px solid', borderColor: activeTab === 'outgoing' ? 'var(--danger)' : 'var(--border)',
            borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', transition: '0.2s'
          }}
        >
          <ArrowDownLeft size={18} /> ของออก (เบิกใช้)
        </button>
      </div>

      {/* Content */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล...</p>
          </div>
        ) : activeTab === 'incoming' ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th><Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> วันที่</th>
                  <th><Package size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> วัสดุ</th>
                  <th style={{ textAlign: 'right' }}>จำนวน</th>
                  <th>หน่วย</th>
                  <th style={{ textAlign: 'right' }}><ShoppingCart size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> ราคา</th>
                  <th>ร้านที่ซื้อ</th>
                  {isAdmin && <th>สาขา</th>}
                </tr>
              </thead>
              <tbody>
                {purchases.length > 0 ? (
                  purchases.map((p, idx) => (
                    <tr key={p.id} style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary)' }}>
                      <td>{formatDate(p.purchase_date)}</td>
                      <td style={{ fontWeight: 500 }}>{p.material_name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{p.quantity}</td>
                      <td><span className="badge badge-info">{p.unit}</span></td>
                      <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>
                        {formatAmount(p.total_price)} ฿
                      </td>
                      <td>{p.store_name || '-'}</td>
                      {isAdmin && <td>{p.branch_name || p.branch_id || '-'}</td>}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                      <Package size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                      <div style={{ fontSize: 16, marginBottom: 8 }}>ยังไม่มีประวัติการรับวัสดุ</div>
                      <div style={{ fontSize: 13 }}>ข้อมูลจะปรากฏเมื่อมีการบันทึกสั่งซื้อของเข้าร้าน</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th><Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> วันที่</th>
                  <th><Package size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> วัสดุ</th>
                  <th style={{ textAlign: 'right' }}>จำนวนเบิก</th>
                  <th>หน่วย</th>
                  <th>เบิกโดย</th>
                  <th>หมายเหตุ</th>
                  {isAdmin && <th>สาขา</th>}
                </tr>
              </thead>
              <tbody>
                {usages.length > 0 ? (
                  usages.map((u, idx) => (
                    <tr key={u.id} style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary)' }}>
                      <td>{formatDate(u.usage_date)}</td>
                      <td style={{ fontWeight: 500 }}>{u.material_name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--danger)' }}>{u.quantity_used}</td>
                      <td><span className="badge badge-warning">{u.unit}</span></td>
                      <td>{u.user_email || '-'}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.notes || '-'}</td>
                      {isAdmin && <td>{u.branch_name || u.branch_id || '-'}</td>}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                      <AlertTriangle size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                      <div style={{ fontSize: 16, marginBottom: 8 }}>ยังไม่มีประวัติการเบิกใช้</div>
                      <div style={{ fontSize: 13 }}>ข้อมูลจะปรากฏเมื่อมีการบันทึกการเบิกวัสดุ</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

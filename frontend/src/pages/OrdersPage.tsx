import { useEffect, useState } from 'react'
import { orderApi } from '../api/client'
import type { Order } from '../types'
import { ClipboardList, ChevronDown, ChevronUp } from 'lucide-react'

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(v)

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    orderApi.getAll().then((r: any) => { setOrders(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">รายการออเดอร์</h1>
          <p className="page-subtitle">ออเดอร์ทั้งหมด {orders.length} รายการ</p>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>เลขที่ออเดอร์</th>
              <th>วันที่</th>
              <th>สถานะ</th>
              <th>หมายเหตุ</th>
              <th style={{ textAlign: 'right' }}>ยอดรวม</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <>
                <tr key={o.id} onClick={() => setExpanded(expanded === o.id ? null : o.id)} style={{ cursor: 'pointer' }}>
                  <td>{expanded === o.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{o.id.slice(0, 8)}...</td>
                  <td>{new Date(o.created_at).toLocaleString('th-TH')}</td>
                  <td>
                    <span className={`badge ${o.status === 'completed' ? 'badge-success' : o.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                      {o.status === 'completed' ? 'สำเร็จ' : o.status === 'cancelled' ? 'ยกเลิก' : 'รอดำเนินการ'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{o.note || '-'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(o.total)}</td>
                </tr>
                {expanded === o.id && o.order_items && (
                  <tr key={`${o.id}-items`}>
                    <td colSpan={6} style={{ padding: '0 16px 12px 48px', background: 'var(--bg-elevated)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' }}>
                        {o.order_items.map((item) => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
                            <span>{item.products?.name || item.product_id} × {item.quantity}</span>
                            <span>{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={6}><div className="empty-state"><ClipboardList /><p>ไม่มีออเดอร์</p></div></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

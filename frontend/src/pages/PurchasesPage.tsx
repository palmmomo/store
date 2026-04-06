import { useState, useEffect } from 'react'
import { stockApi } from '../api/client'
import { FileText, ClipboardList } from 'lucide-react'

interface PurchaseRecord {
  id: number
  quantity: number
  total_price: number
  unit_cost: number
  purchase_date: string
  receipt_no: string
  materials: {
    name: string
  }
  suppliers: {
    name: string
  }
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([])
  const [loading, setLoading] = useState(true)

  const loadPurchases = async () => {
    try {
      const res = await stockApi.getPurchases()
      const data = res.data?.data || res.data || []
      setPurchases(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Load purchases error:', err)
      setPurchases([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPurchases() }, [])

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: 24 }}>กำลังโหลดข้อมูลการซื้อ...</p>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">ประวัติการซื้อวัสดุ</h1>
          <p className="page-subtitle">รายการสั่งซื้อและรับเข้าวัสดุทั้งหมด</p>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>วันที่ซื้อ</th>
              <th>ชื่อวัสดุ</th>
              <th>ร้านค้า/คู่ค้า</th>
              <th>เลขที่บิล/ใบเสร็จ</th>
              <th style={{ textAlign: 'right' }}>จำนวนที่ซื้อ</th>
              <th style={{ textAlign: 'right' }}>ราคาต้นทุน/หน่วย</th>
              <th style={{ textAlign: 'right' }}>ราคารวม</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map(p => (
              <tr key={p.id}>
                <td>{new Date(p.purchase_date).toLocaleDateString('th-TH')}</td>
                <td style={{ fontWeight: 500 }}>{p.materials?.name || 'ไม่ระบุ'}</td>
                <td>{p.suppliers?.name || 'ไม่ระบุ'}</td>
                <td>
                  {p.receipt_no ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                      <FileText size={12} /> {p.receipt_no}
                    </span>
                  ) : '-'}
                </td>
                <td style={{ textAlign: 'right' }}>{p.quantity}</td>
                <td style={{ textAlign: 'right' }}>฿{p.unit_cost?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                  ฿{p.total_price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            {purchases.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                  <ClipboardList size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><br />
                  ยังไม่มีประวัติการจัดซื้อ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

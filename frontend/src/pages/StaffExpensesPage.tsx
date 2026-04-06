import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { expensesApi } from '../api/client'
import { Plus, Wallet, Pencil, Trash2, X, Receipt } from 'lucide-react'

interface Expense {
  id: number
  title: string
  amount: number
  note: string
  expense_date: string
  branch_id?: string
  branches?: { name: string }
  user_email?: string
}

export default function StaffExpensesPage() {
  const [expenseTitle, setExpenseTitle] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseNote, setExpenseNote] = useState('')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadExpenses = async () => {
    try {
      setLoading(true)
      const res = await expensesApi.getAll()
      setExpenses(res?.data || [])
    } catch (err) {
      console.error('Load expenses error:', err)
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExpenses()
  }, [])

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expenseTitle || !expenseAmount) return
    setSaving(true)
    try {
      await expensesApi.create({
        title: expenseTitle,
        amount: parseFloat(expenseAmount),
        note: expenseNote
      })
      toast.success('บันทึกค่าใช้จ่ายสำเร็จ!')
      setExpenseTitle('')
      setExpenseAmount('')
      setExpenseNote('')
      loadExpenses()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editExpense || !editExpense.title || !editExpense.amount) return
    setSaving(true)
    try {
      await expensesApi.update(editExpense.id, {
        title: editExpense.title,
        amount: parseFloat(String(editExpense.amount)),
        note: editExpense.note
      })
      toast.success('อัปเดตค่าใช้จ่ายสำเร็จ!')
      setEditExpense(null)
      loadExpenses()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'เกิดข้อผิดพลาดในการอัปเดต')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('ยืนยันที่จะลบค่าใช้จ่ายนี้?')) return
    try {
      await expensesApi.delete(id)
      toast.success('ลบค่าใช้จ่ายสำเร็จ')
      loadExpenses()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'ไม่สามารถลบได้')
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
    const num = Math.abs(parseFloat(String(amount)) || 0)
    return num.toLocaleString('th-TH')
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="page-title">บันทึกรายจ่าย</h1>
          <p className="page-subtitle">บันทึกค่าใช้จ่ายทั่วไปของร้าน</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSaveExpense}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, color: 'var(--primary)' }}>
            <Wallet size={20} />
            <h2 style={{ fontSize: 16, margin: 0 }}>บันทึกค่าใช้จ่ายทั่วไป</h2>
          </div>

          <div className="form-group">
            <label className="form-label">รายการ / ชื่อค่าใช้จ่าย</label>
            <input className="form-input" value={expenseTitle} onChange={e => setExpenseTitle(e.target.value)} placeholder="เช่น ค่าไฟ, ค่าน้ำ, ค่าแรงพนักงาน" required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">จำนวนเงิน (บาท)</label>
            <input type="number" min="0" step="0.01" className="form-input" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} placeholder="0.00" required />
          </div>
          <div className="form-group">
            <label className="form-label">หมายเหตุ (ถ้ามี)</label>
            <input className="form-input" value={expenseNote} onChange={e => setExpenseNote(e.target.value)} placeholder="รายละเอียดเพิ่มเติม" />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px 0', fontSize: 16, marginTop: 12 }} disabled={saving}>
            <Plus size={20} /> {saving ? 'กำลังบันทึก...' : 'บันทึกจ่ายเงิน'}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Receipt size={18} /> ประวัติค่าใช้จ่ายล่าสุด
        </h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>วันที่</th>
                <th>รายการ</th>
                <th style={{ textAlign: 'right' }}>จำนวนเงิน</th>
                <th>หมายเหตุ</th>
                <th style={{ textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 40 }}>
                    <p style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p>
                  </td>
                </tr>
              ) : expenses?.length > 0 ? (
                expenses.map((ex, idx) => (
                  <tr key={ex?.id} style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary)' }}>
                    <td style={{ fontSize: 13 }}>{formatDate(ex?.expense_date)}</td>
                    <td style={{ fontWeight: 500 }}>{ex?.title || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--danger)' }}>
                      ฿{formatAmount(ex?.amount)} บาท
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{ex?.note || '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-icon" onClick={() => setEditExpense(ex)} title="แก้ไข"><Pencil size={14} /></button>
                      <button className="btn-icon delete" onClick={() => handleDeleteExpense(ex?.id)} title="ลบ"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                    <Receipt size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <div>ยังไม่มีข้อมูลรายจ่าย</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editExpense && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>แก้ไขค่าใช้จ่าย</h2>
              <button className="btn-icon" onClick={() => setEditExpense(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateExpense}>
              <div className="form-group">
                <label className="form-label">รายการ</label>
                <input className="form-input" value={editExpense.title} onChange={e => setEditExpense({ ...editExpense, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">จำนวนเงิน (บาท)</label>
                <input type="number" min="0" step="0.01" className="form-input" value={editExpense.amount} onChange={e => setEditExpense({ ...editExpense, amount: parseFloat(e.target.value) || 0 })} required />
              </div>
              <div className="form-group">
                <label className="form-label">หมายเหตุ</label>
                <input className="form-input" value={editExpense.note} onChange={e => setEditExpense({ ...editExpense, note: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditExpense(null)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>บันทึกการแก้ไข</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

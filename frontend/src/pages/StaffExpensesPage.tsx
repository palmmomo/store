import { useState, useEffect, Component, type ReactNode } from 'react'
import { toast } from 'react-hot-toast'
import { expensesApi, stockApi } from '../api/client'
import { Plus, Wallet, ShoppingCart, Send, Pencil, Trash2, X, AlertCircle } from 'lucide-react'

interface Material {
  id: number
  name: string
  category?: { name: string }
  unit: string
  current_stock: number
}

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

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('StaffExpensesPage Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: 16 }} />
          <h3 style={{ color: 'var(--danger)' }}>เกิดข้อผิดพลาดในการแสดงผล</h3>
          <p style={{ color: 'var(--text-muted)' }}>กรุณารีเฟรชหน้าเพื่อลองใหม่</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()} style={{ marginTop: 16 }}>
            รีเฟรชหน้า
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function StaffExpensesPage() {
  return (
    <ErrorBoundary>
      <StaffExpensesPageContent />
    </ErrorBoundary>
  )
}

function StaffExpensesPageContent() {
  const [activeTab, setActiveTab] = useState<'expense' | 'purchase'>('expense')
  const [materials, setMaterials] = useState<Material[]>([])
  
  // Expense Form
  const [expenseTitle, setExpenseTitle] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseNote, setExpenseNote] = useState('')
  
  // Purchase Form
  const [purchaseItemName, setPurchaseItemName] = useState('')
  const [purchaseQty, setPurchaseQty] = useState('')
  const [purchaseUnit, setPurchaseUnit] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchaseStore, setPurchaseStore] = useState('')
  
  // History
  const [expenses, setExpenses] = useState<Expense[]>([])
  
  // Edit Modal
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

  useEffect(() => {
    if (activeTab === 'purchase') {
      loadMaterials()
    }
  }, [activeTab])

  const loadMaterials = async () => {
    try {
      const res = await stockApi.getAll()
      setMaterials(res?.data?.data || res?.data || [])
    } catch (err) {
      console.error('Load materials error:', err)
      setMaterials([])
    }
  }

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

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!purchaseItemName || !purchaseQty || !purchaseUnit || !purchasePrice) return
    setSaving(true)
    try {
      await stockApi.simplePurchase({
        item_name: purchaseItemName,
        quantity: parseFloat(purchaseQty),
        unit: purchaseUnit,
        price: parseFloat(purchasePrice),
        store_name: purchaseStore
      })
      toast.success('บันทึกสั่งซื้อวัสดุสำเร็จ!')
      setPurchaseItemName('')
      setPurchaseQty('')
      setPurchaseUnit('')
      setPurchasePrice('')
      setPurchaseStore('')
      loadMaterials()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setSaving(false)
    }
  }

  // Format date to Buddhist Era correctly
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    // Use Buddhist Era (CE + 543)
    return `${day}/${month}/${year + 543}`
  }

  // Format amount without negative sign
  const formatAmount = (amount: number) => {
    const num = Math.abs(parseFloat(String(amount)) || 0)
    return num.toLocaleString('th-TH')
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="page-title">บันทึกรายจ่าย</h1>
          <p className="page-subtitle">บันทึกค่าใช้จ่ายทั่วไป และการสั่งซื้อของเข้าร้าน</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button 
          onClick={() => setActiveTab('expense')}
          style={{ 
            flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
            background: activeTab === 'expense' ? 'var(--primary)' : 'var(--bg-card)',
            color: activeTab === 'expense' ? 'white' : 'var(--text)',
            border: '1px solid', borderColor: activeTab === 'expense' ? 'var(--primary)' : 'var(--border)',
            borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', transition: '0.2s'
          }}
        >
          <Wallet size={18} /> จ่ายค่าใช้จ่าย
        </button>
        <button 
          onClick={() => setActiveTab('purchase')}
          style={{ 
            flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
            background: activeTab === 'purchase' ? 'var(--primary)' : 'var(--bg-card)',
            color: activeTab === 'purchase' ? 'white' : 'var(--text)',
            border: '1px solid', borderColor: activeTab === 'purchase' ? 'var(--primary)' : 'var(--border)',
            borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', transition: '0.2s'
          }}
        >
          <ShoppingCart size={18} /> สั่งซื้อของ
        </button>
      </div>

      <div className="card">
        {activeTab === 'expense' ? (
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
        ) : (
          <form onSubmit={handleSavePurchase}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, color: 'var(--primary)' }}>
              <ShoppingCart size={20} />
              <h2 style={{ fontSize: 16, margin: 0 }}>บันทึกสั่งซื้อวัสดุเข้าร้าน</h2>
            </div>

            <div className="form-group">
              <label className="form-label">ชื่อวัสดุ</label>
              <input 
                className="form-input" 
                value={purchaseItemName} 
                onChange={e => setPurchaseItemName(e.target.value)} 
                placeholder="พิมพ์ชื่อวัสดุ (เช่น ไวนิล, หมึกพิมพ์)"
                required 
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">จำนวน</label>
                <input type="number" min="0" step="0.01" className="form-input" value={purchaseQty} onChange={e => setPurchaseQty(e.target.value)} placeholder="0.00" required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">หน่วย</label>
                <input 
                  className="form-input" 
                  value={purchaseUnit} 
                  onChange={e => setPurchaseUnit(e.target.value)} 
                  placeholder="เช่น ม้วน, แผ่น, ลิตร"
                  list="unit-suggestions"
                  required 
                />
                <datalist id="unit-suggestions">
                  <option value="ม้วน" />
                  <option value="แผ่น" />
                  <option value="ชิ้น" />
                  <option value="ลิตร" />
                  <option value="ชุด" />
                  <option value="ตร.ม." />
                </datalist>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">ราคารวม (บาท)</label>
              <input type="number" min="0" step="0.01" className="form-input" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="0.00" required />
            </div>

            <div className="form-group">
              <label className="form-label">ชื่อร้านที่สั่งซื้อ / ใบเสร็จ</label>
              <input className="form-input" value={purchaseStore} onChange={e => setPurchaseStore(e.target.value)} placeholder="เช่น ร้านอุปกรณ์ไตรภาค, Shopee" />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px 0', fontSize: 16, marginTop: 12 }} disabled={saving}>
              <Send size={20} /> {saving ? 'กำลังบันทึก...' : 'บันทึกสั่งซื้อของ'}
            </button>
          </form>
        )}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16, fontSize: 16 }}>ประวัติค่าใช้จ่ายล่าสุด</h3>
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
                  <td colSpan={5} style={{ textAlign: 'center', padding: 20 }}>
                    <p style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p>
                  </td>
                </tr>
              ) : expenses?.length > 0 ? (
                expenses.map(ex => (
                  <tr key={ex?.id}>
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
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
                    ยังไม่มีข้อมูลรายจ่าย
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

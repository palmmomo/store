import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'
import {
  LayoutDashboard, Package, ClipboardList, BarChart3, FileText,
  Building2, TrendingUp, Plus, Banknote, CreditCard,
  ArrowUpRight, ArrowDownLeft, Calendar, Users, DollarSign,
  ShoppingBag, Receipt, AlertTriangle,
} from 'lucide-react'

// =============================================
// MOCK DATA
// =============================================
const fmt = (v: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(v)
const now = new Date()

interface Transaction {
  id: string
  date: string
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
  paymentMethod: 'cash' | 'transfer'
  note: string
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', date: '2026-03-20', type: 'income', category: 'ขายอาหาร', description: 'ออเดอร์ #001 ข้าวผัดกุ้ง x3', amount: 255, paymentMethod: 'cash', note: '' },
  { id: 't2', date: '2026-03-20', type: 'income', category: 'ขายอาหาร', description: 'ออเดอร์ #002 ต้มยำกุ้ง x2', amount: 240, paymentMethod: 'transfer', note: 'โอนผ่าน SCB' },
  { id: 't3', date: '2026-03-20', type: 'expense', category: 'ซื้อวัตถุดิบ', description: 'กุ้ง 5 กก.', amount: 850, paymentMethod: 'cash', note: 'ตลาดเช้า' },
  { id: 't4', date: '2026-03-20', type: 'income', category: 'ขายเครื่องดื่ม', description: 'ออเดอร์ #003 ชาเย็น x5', amount: 175, paymentMethod: 'cash', note: '' },
  { id: 't5', date: '2026-03-19', type: 'income', category: 'ขายอาหาร', description: 'ออเดอร์ #004 กะเพราหมู x4', amount: 260, paymentMethod: 'transfer', note: '' },
  { id: 't6', date: '2026-03-19', type: 'expense', category: 'ซื้อวัตถุดิบ', description: 'ผัก, ไข่, หมู', amount: 1200, paymentMethod: 'transfer', note: 'Makro' },
  { id: 't7', date: '2026-03-19', type: 'income', category: 'ขายอาหาร', description: 'ออเดอร์ #005 ข้าวผัดกุ้ง x2', amount: 170, paymentMethod: 'cash', note: '' },
  { id: 't8', date: '2026-03-19', type: 'expense', category: 'ค่าใช้จ่ายร้าน', description: 'ค่าแก๊ส', amount: 450, paymentMethod: 'cash', note: '' },
  { id: 't9', date: '2026-03-18', type: 'income', category: 'ขายอาหาร', description: 'ออเดอร์ #006 ส้มตำ, ลาบหมู', amount: 125, paymentMethod: 'cash', note: '' },
  { id: 't10', date: '2026-03-18', type: 'expense', category: 'ซื้อวัตถุดิบ', description: 'น้ำมัน, ซอส', amount: 380, paymentMethod: 'cash', note: '' },
]

const MOCK_STOCK = [
  { id: 's1', name: 'กุ้ง', category: 'วัตถุดิบ', qty: 8, min: 5, unit: 'กก.' },
  { id: 's2', name: 'หมูสับ', category: 'วัตถุดิบ', qty: 3, min: 5, unit: 'กก.' },
  { id: 's3', name: 'ข้าว', category: 'วัตถุดิบ', qty: 20, min: 10, unit: 'กก.' },
  { id: 's4', name: 'น้ำมันพืช', category: 'เครื่องปรุง', qty: 4, min: 3, unit: 'ขวด' },
  { id: 's5', name: 'ไข่ไก่', category: 'วัตถุดิบ', qty: 2, min: 10, unit: 'แผง' },
  { id: 's6', name: 'ผักชี', category: 'วัตถุดิบ', qty: 15, min: 5, unit: 'กำ' },
]

const MOCK_BRANCHES = [
  { id: 'b1', name: 'สาขาลาดพร้าว', address: '123 ถ.ลาดพร้าว กรุงเทพฯ', phone: '02-111-1111', active: true },
  { id: 'b2', name: 'สาขาสยาม', address: '999 ถ.พระราม 1 กรุงเทพฯ', phone: '02-222-2222', active: true },
  { id: 'b3', name: 'สาขาอนุสาวรีย์', address: '456 ถ.พหลโยธิน กรุงเทพฯ', phone: '02-333-3333', active: false },
]

const MOCK_USERS = [
  { id: 'u1', email: 'admin@restaurant.com', role: 'superadmin', branch: '-' },
  { id: 'u2', email: 'manager@ladprao.com', role: 'branch_admin', branch: 'สาขาลาดพร้าว' },
  { id: 'u3', email: 'staff@siam.com', role: 'staff', branch: 'สาขาสยาม' },
]

const CHART_30 = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(now); d.setDate(d.getDate() - 29 + i)
  return { label: d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }), income: 600 + Math.floor(Math.random() * 3000), expense: 300 + Math.floor(Math.random() * 1500) }
})

// =============================================
// PAGES
// =============================================

function DashboardPage() {
  const today = MOCK_TRANSACTIONS.filter(t => t.date === '2026-03-20')
  const income = today.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = today.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const cashIn = today.filter(t => t.type === 'income' && t.paymentMethod === 'cash').reduce((s, t) => s + t.amount, 0)
  const transferIn = today.filter(t => t.type === 'income' && t.paymentMethod === 'transfer').reduce((s, t) => s + t.amount, 0)
  const lowStock = MOCK_STOCK.filter(s => s.qty <= s.min).length

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Dashboard</h1><p className="page-subtitle">ภาพรวมร้านค้าวันนี้</p></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
          <Calendar size={14} /> {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"><ArrowUpRight size={20} /></div>
          <div><div className="stat-label">รายรับวันนี้</div><div className="stat-value" style={{ color: 'var(--success)' }}>{fmt(income)}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><ArrowDownLeft size={20} /></div>
          <div><div className="stat-label">รายจ่ายวันนี้</div><div className="stat-value" style={{ color: 'var(--danger)' }}>{fmt(expense)}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><DollarSign size={20} /></div>
          <div><div className="stat-label">กำไรสุทธิ</div><div className="stat-value">{fmt(income - expense)}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><Receipt size={20} /></div>
          <div><div className="stat-label">รายการวันนี้</div><div className="stat-value">{today.length}</div></div>
        </div>
      </div>

      <div className="summary-row">
        <div className="card">
          <div className="card-header"><span className="card-title">แยกตามช่องทาง</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}><Banknote size={16} color="var(--success)" /> เงินสด</div>
              <span style={{ fontWeight: 600 }}>{fmt(cashIn)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}><CreditCard size={16} color="var(--info)" /> เงินโอน</div>
              <span style={{ fontWeight: 600 }}>{fmt(transferIn)}</span>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">แจ้งเตือน</span></div>
          {lowStock > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)' }}>
              <AlertTriangle size={16} color="var(--warning)" />
              <span style={{ fontSize: 13 }}>สต็อกต่ำกว่ากำหนด {lowStock} รายการ</span>
            </div>
          ) : <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>ไม่มีแจ้งเตือน</p>}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">รายรับ-รายจ่าย 30 วัน</span></div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 180, padding: '16px 4px 8px' }}>
          {CHART_30.map((d, i) => {
            const max = Math.max(...CHART_30.map(c => c.income))
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }} title={`${d.label}\nรายรับ: ${fmt(d.income)}\nรายจ่าย: ${fmt(d.expense)}`}>
                <div style={{ width: '100%', height: (d.income / max) * 140, background: '#6366f1', borderRadius: '2px 2px 0 0', minWidth: 4, opacity: 0.85 }} />
                <div style={{ width: '100%', height: (d.expense / max) * 140, background: '#ef4444', borderRadius: '0 0 2px 2px', minWidth: 4, opacity: 0.4 }} />
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 4px 0', fontSize: 10, color: 'var(--text-muted)' }}>
          <span>{CHART_30[0].label}</span><span>{CHART_30[14].label}</span><span>{CHART_30[29].label}</span>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#6366f1', borderRadius: 2, marginRight: 4 }}></span>รายรับ</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#ef4444', borderRadius: 2, marginRight: 4, opacity: 0.4 }}></span>รายจ่าย</span>
        </div>
      </div>
    </div>
  )
}

function RecordPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'income' as 'income' | 'expense', category: '', description: '', amount: '', paymentMethod: 'cash' as 'cash' | 'transfer', note: '' })

  const handleSave = () => {
    if (!form.category || !form.amount) return
    const t: Transaction = {
      id: `t-${Date.now()}`, date: new Date().toISOString().split('T')[0],
      type: form.type, category: form.category, description: form.description,
      amount: parseFloat(form.amount), paymentMethod: form.paymentMethod, note: form.note,
    }
    setTransactions([t, ...transactions])
    setShowForm(false)
    setForm({ type: 'income', category: '', description: '', amount: '', paymentMethod: 'cash', note: '' })
  }

  const incomeCategories = ['ขายอาหาร', 'ขายเครื่องดื่ม', 'รายรับอื่นๆ']
  const expenseCategories = ['ซื้อวัตถุดิบ', 'ค่าใช้จ่ายร้าน', 'ค่าน้ำ/ไฟ', 'เงินเดือน', 'อื่นๆ']
  const cats = form.type === 'income' ? incomeCategories : expenseCategories

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">บันทึกรายการ</h1><p className="page-subtitle">กรอกข้อมูลซื้อ-ขายประจำวัน</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> เพิ่มรายการ</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead><tr><th>วันที่</th><th>ประเภท</th><th>หมวดหมู่</th><th>รายละเอียด</th><th>ช่องทาง</th><th style={{ textAlign: 'right' }}>จำนวนเงิน</th><th>หมายเหตุ</th></tr></thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id}>
                <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{t.date}</td>
                <td>
                  <span className={`badge ${t.type === 'income' ? 'badge-success' : 'badge-danger'}`}>
                    {t.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                  </span>
                </td>
                <td><span className="tag">{t.category}</span></td>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{t.description}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                    {t.paymentMethod === 'cash' ? <Banknote size={13} /> : <CreditCard size={13} />}
                    {t.paymentMethod === 'cash' ? 'เงินสด' : 'โอน'}
                  </div>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: t.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.note || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 520 }}>
            <h2 className="modal-title">เพิ่มรายการใหม่</h2>

            <div className="form-group">
              <label className="form-label">ประเภท</label>
              <div className="payment-methods">
                <button className={`payment-btn ${form.type === 'income' ? 'selected' : ''}`} onClick={() => setForm({ ...form, type: 'income', category: '' })}>
                  <ArrowUpRight size={16} /> รายรับ
                </button>
                <button className={`payment-btn ${form.type === 'expense' ? 'selected' : ''}`} onClick={() => setForm({ ...form, type: 'expense', category: '' })}>
                  <ArrowDownLeft size={16} /> รายจ่าย
                </button>
              </div>
            </div>

            <div className="transaction-form">
              <div>
                <label className="form-label">หมวดหมู่</label>
                <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="">-- เลือก --</option>
                  {cats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">จำนวนเงิน (บาท)</label>
                <input className="form-input" type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">รายละเอียด</label>
              <input className="form-input" placeholder="เช่น ออเดอร์ #001, ซื้อกุ้ง 5 กก." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">ช่องทางชำระเงิน</label>
              <div className="payment-methods">
                <button className={`payment-btn ${form.paymentMethod === 'cash' ? 'selected' : ''}`} onClick={() => setForm({ ...form, paymentMethod: 'cash' })}>
                  <Banknote size={16} /> เงินสด
                </button>
                <button className={`payment-btn ${form.paymentMethod === 'transfer' ? 'selected' : ''}`} onClick={() => setForm({ ...form, paymentMethod: 'transfer' })}>
                  <CreditCard size={16} /> เงินโอน
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">หมายเหตุ</label>
              <input className="form-input" placeholder="(ไม่บังคับ)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.category || !form.amount}>บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StockPage() {
  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">สต็อกวัตถุดิบ</h1><p className="page-subtitle">จัดการสต็อกและปริมาณ</p></div></div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>รายการ</th><th>หมวดหมู่</th><th>จำนวน</th><th>ขั้นต่ำ</th><th>หน่วย</th><th>สถานะ</th></tr></thead>
          <tbody>
            {MOCK_STOCK.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.name}</td>
                <td><span className="tag">{s.category}</span></td>
                <td style={{ fontWeight: 700, color: s.qty <= s.min ? 'var(--danger)' : 'var(--text-primary)' }}>{s.qty}</td>
                <td>{s.min}</td>
                <td>{s.unit}</td>
                <td>{s.qty <= s.min ? <span className="badge badge-danger"><AlertTriangle size={11} /> ต่ำกว่ากำหนด</span> : <span className="badge badge-success">ปกติ</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatsPage() {
  const allIncome = MOCK_TRANSACTIONS.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const allExpense = MOCK_TRANSACTIONS.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">สถิติ</h1><p className="page-subtitle">ข้อมูลรายรับ-รายจ่าย</p></div></div>
      <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="stat-card"><div className="stat-icon green"><ArrowUpRight size={20} /></div><div><div className="stat-label">รายรับรวม</div><div className="stat-value" style={{ color: 'var(--success)' }}>{fmt(allIncome)}</div></div></div>
        <div className="stat-card"><div className="stat-icon red"><ArrowDownLeft size={20} /></div><div><div className="stat-label">รายจ่ายรวม</div><div className="stat-value" style={{ color: 'var(--danger)' }}>{fmt(allExpense)}</div></div></div>
        <div className="stat-card"><div className="stat-icon blue"><DollarSign size={20} /></div><div><div className="stat-label">กำไรสุทธิ</div><div className="stat-value">{fmt(allIncome - allExpense)}</div></div></div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">รายรับ-รายจ่าย 30 วัน</span></div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 220, padding: '16px 4px 8px' }}>
          {CHART_30.map((d, i) => {
            const max = Math.max(...CHART_30.map(c => c.income))
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }} title={`${d.label}\n+${fmt(d.income)} / -${fmt(d.expense)}`}>
                <div style={{ width: '100%', height: (d.income / max) * 170, background: '#6366f1', borderRadius: '2px 2px 0 0', minWidth: 4, opacity: 0.85 }} />
                <div style={{ width: '100%', height: (d.expense / max) * 170, background: '#ef4444', borderRadius: '0 0 2px 2px', minWidth: 4, opacity: 0.4 }} />
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 4px 0', fontSize: 10, color: 'var(--text-muted)' }}>
          <span>{CHART_30[0].label}</span><span>{CHART_30[29].label}</span>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#6366f1', borderRadius: 2, marginRight: 4 }}></span>รายรับ</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#ef4444', borderRadius: 2, marginRight: 4, opacity: 0.4 }}></span>รายจ่าย</span>
        </div>
      </div>
    </div>
  )
}

function SummaryPage() {
  const byDate = MOCK_TRANSACTIONS.reduce<Record<string, { income: number; expense: number; count: number }>>((acc, t) => {
    if (!acc[t.date]) acc[t.date] = { income: 0, expense: 0, count: 0 }
    acc[t.date].count++
    if (t.type === 'income') acc[t.date].income += t.amount; else acc[t.date].expense += t.amount
    return acc
  }, {})
  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">สรุปรายวัน</h1><p className="page-subtitle">รายรับ-รายจ่ายรายวัน</p></div></div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>วันที่</th><th>รายการ</th><th style={{ textAlign: 'right' }}>รายรับ</th><th style={{ textAlign: 'right' }}>รายจ่าย</th><th style={{ textAlign: 'right' }}>กำไร</th></tr></thead>
          <tbody>
            {Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a)).map(([date, d]) => (
              <tr key={date}>
                <td style={{ fontWeight: 500 }}>{date}</td>
                <td>{d.count} รายการ</td>
                <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>+{fmt(d.income)}</td>
                <td style={{ textAlign: 'right', color: 'var(--danger)', fontWeight: 600 }}>-{fmt(d.expense)}</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(d.income - d.expense)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LogsPage() {
  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">บันทึกกิจกรรม</h1><p className="page-subtitle">ประวัติการเปลี่ยนแปลงสต็อก</p></div></div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>เวลา</th><th>รายการ</th><th>เปลี่ยนแปลง</th><th>เหตุผล</th></tr></thead>
          <tbody>
            {[
              { time: '14:30', product: 'กุ้ง', change: +5, reason: 'รับของจากซัพพลายเออร์' },
              { time: '12:00', product: 'หมูสับ', change: -2, reason: 'ใช้ทำอาหาร' },
              { time: '10:15', product: 'ไข่ไก่', change: -8, reason: 'ใช้ทำอาหาร' },
              { time: '08:00', product: 'น้ำมันพืช', change: +6, reason: 'ซื้อเพิ่ม' },
            ].map((l, i) => (
              <tr key={i}>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.time}</td>
                <td style={{ fontWeight: 500 }}>{l.product}</td>
                <td style={{ fontWeight: 600, color: l.change >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {l.change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}
                    {l.change >= 0 ? '+' : ''}{l.change}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{l.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BranchManagePage() {
  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">จัดการสาขา</h1><p className="page-subtitle">เพิ่ม แก้ไข ปิด/เปิดสาขา</p></div></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {MOCK_BRANCHES.map(b => (
          <div key={b.id} className="card" style={{ opacity: b.active ? 1 : 0.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="stat-icon blue" style={{ width: 36, height: 36 }}><Building2 size={16} /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{b.address}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{b.phone}</div>
                </div>
              </div>
              <span className={`badge ${b.active ? 'badge-success' : 'badge-danger'}`}>{b.active ? 'เปิด' : 'ปิด'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function UsersManagePage() {
  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">จัดการผู้ใช้</h1><p className="page-subtitle">บัญชีผู้ใช้ระบบ</p></div></div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>อีเมล</th><th>บทบาท</th><th>สาขา</th></tr></thead>
          <tbody>
            {MOCK_USERS.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{u.email}</td>
                <td><span className={`badge ${u.role === 'superadmin' ? 'badge-purple' : u.role === 'branch_admin' ? 'badge-info' : ''}`}>{u.role}</span></td>
                <td>{u.branch}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// =============================================
// SIDEBAR + APP
// =============================================
const navItems = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/record', icon: <ClipboardList size={18} />, label: 'บันทึกรายการ' },
  { to: '/stock', icon: <Package size={18} />, label: 'สต็อกวัตถุดิบ' },
  { to: '/stats', icon: <BarChart3 size={18} />, label: 'สถิติ' },
  { to: '/summary', icon: <TrendingUp size={18} />, label: 'สรุปรายวัน' },
  { to: '/logs', icon: <FileText size={18} />, label: 'บันทึกกิจกรรม' },
]
const adminItems = [
  { to: '/admin/branches', icon: <Building2 size={18} />, label: 'จัดการสาขา' },
  { to: '/admin/users', icon: <Users size={18} />, label: 'จัดการผู้ใช้' },
]

function SidebarNav() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1><ShoppingBag size={20} /> ร้านอาหาร</h1>
        <p>ระบบจัดการร้านค้า</p>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-label">เมนูหลัก</div>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            {item.icon}{item.label}
          </NavLink>
        ))}
        <div className="nav-section-label" style={{ marginTop: 8 }}>จัดการระบบ</div>
        {adminItems.map(item => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            {item.icon}{item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">A</div>
          <div className="user-details">
            <div className="user-name">admin@restaurant.com</div>
            <div className="user-role">superadmin</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <div className="app-layout">
        <SidebarNav />
        <div className="main-content">
          <div className="page-content">
            <Routes>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/record" element={<RecordPage />} />
              <Route path="/stock" element={<StockPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/summary" element={<SummaryPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/admin/branches" element={<BranchManagePage />} />
              <Route path="/admin/users" element={<UsersManagePage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App

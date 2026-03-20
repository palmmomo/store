import { BrowserRouter, Routes, Route, Navigate, NavLink, useParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect } from 'react'
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
  branchId: string // เพิ่มสาขา
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
  paymentMethod: 'cash' | 'transfer'
  note: string
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', date: '2026-03-20', branchId: 'b1', type: 'income', category: 'ขายอาหาร', description: 'ออเดอร์ #001 ข้าวผัดกุ้ง x3', amount: 255, paymentMethod: 'cash', note: '' },
  { id: 't2', date: '2026-03-20', branchId: 'b1', type: 'income', category: 'ขายอาหาร', description: 'ออเดอร์ #002 ต้มยำกุ้ง x2', amount: 240, paymentMethod: 'transfer', note: 'โอนผ่าน SCB' },
  { id: 't3', date: '2026-03-20', branchId: 'b1', type: 'expense', category: 'ซื้อวัตถุดิบ', description: 'กุ้ง 5 กก.', amount: 850, paymentMethod: 'cash', note: 'ตลาดเช้า' },
  { id: 't4', date: '2026-03-20', branchId: 'b2', type: 'income', category: 'ขายเครื่องดื่ม', description: 'ออเดอร์ #003 ชาเย็น x5', amount: 175, paymentMethod: 'cash', note: '' },
  { id: 't5', date: '2026-03-19', branchId: 'b2', type: 'income', category: 'ขายอาหาร', description: 'ออเดอร์ #004 กะเพราหมู x4', amount: 260, paymentMethod: 'transfer', note: '' },
  { id: 't6', date: '2026-03-19', branchId: 'b1', type: 'expense', category: 'ซื้อวัตถุดิบ', description: 'ผัก, ไข่, หมู', amount: 1200, paymentMethod: 'transfer', note: 'Makro' },
  { id: 't7', date: '2026-03-19', branchId: 'b1', type: 'income', category: 'ขายอาหาร', description: 'ออเดอร์ #005 ข้าวผัดกุ้ง x2', amount: 170, paymentMethod: 'cash', note: '' },
  { id: 't8', date: '2026-03-19', branchId: 'b2', type: 'expense', category: 'ค่าใช้จ่ายร้าน', description: 'ค่าแก๊ส', amount: 450, paymentMethod: 'cash', note: '' },
  { id: 't9', date: '2026-03-18', branchId: 'b1', type: 'income', category: 'ขายอาหาร', description: 'ออเดอร์ #006 ส้มตำ, ลาบหมู', amount: 125, paymentMethod: 'cash', note: '' },
  { id: 't10', date: '2026-03-18', branchId: 'b2', type: 'expense', category: 'ซื้อวัตถุดิบ', description: 'น้ำมัน, ซอส', amount: 380, paymentMethod: 'cash', note: '' },
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
  { id: 'u1', email: 'admin@restaurant.com', role: 'admin', branch: '-' },
  { id: 'u2', email: 'staff1@ladprao.com', role: 'staff', branch: 'สาขาลาดพร้าว' },
  { id: 'u3', email: 'staff2@siam.com', role: 'staff', branch: 'สาขาสยาม' },
]

const CHART_30 = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(now); d.setDate(d.getDate() - 29 + i)
  return { label: d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }), income: 600 + Math.floor(Math.random() * 3000), expense: 300 + Math.floor(Math.random() * 1500) }
})

// =============================================
// AUTH & CONTEXT (MOCK)
// =============================================
// INITIAL_USER จะถูกกำหนดใน App component โดยใช้ state ของ users

// =============================================
// PAGES
// =============================================

function AdminDashboardPage({ branches }: { branches: typeof MOCK_BRANCHES }) {
  const today = MOCK_TRANSACTIONS.filter(t => t.date === '2026-03-20')
  const income = today.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = today.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const cashIn = today.filter(t => t.type === 'income' && t.paymentMethod === 'cash').reduce((s, t) => s + t.amount, 0)
  const transferIn = today.filter(t => t.type === 'income' && t.paymentMethod === 'transfer').reduce((s, t) => s + t.amount, 0)
  const lowStock = MOCK_STOCK.filter(s => s.qty <= s.min).length

  // แยกตามสาขา
  const branchStats = branches.map(b => {
    const bToday = today.filter(t => t.branchId === b.id)
    const bInc = bToday.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const bExp = bToday.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { ...b, income: bInc, expense: bExp }
  })

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Admin Dashboard</h1><p className="page-subtitle">ภาพรวมทุกสาขาวันนี้</p></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
          <Calendar size={14} /> {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"><ArrowUpRight size={20} /></div>
          <div><div className="stat-label">รายรับรวมวันนี้</div><div className="stat-value" style={{ color: 'var(--success)' }}>{fmt(income)}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><ArrowDownLeft size={20} /></div>
          <div><div className="stat-label">รายจ่ายรวมวันนี้</div><div className="stat-value" style={{ color: 'var(--danger)' }}>{fmt(expense)}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><DollarSign size={20} /></div>
          <div><div className="stat-label">กำไรสุทธิ</div><div className="stat-value">{fmt(income - expense)}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><Receipt size={20} /></div>
          <div><div className="stat-label">รวม {today.length} รายการ</div><div className="stat-value">{MOCK_BRANCHES.length} สาขา</div></div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><span className="card-title">สรุปยอดแยกตามสาขา</span></div>
        <div className="table-wrapper" style={{ boxShadow: 'none', border: 'none', padding: 0 }}>
          <table style={{ margin: 0 }}>
            <thead><tr><th>ชื่อสาขา</th><th style={{ textAlign: 'right' }}>รายรับ</th><th style={{ textAlign: 'right' }}>รายจ่าย</th><th style={{ textAlign: 'right' }}>กำไร</th></tr></thead>
            <tbody>
              {branchStats.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.name}</td>
                  <td style={{ textAlign: 'right', color: 'var(--success)' }}>{fmt(b.income)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--danger)' }}>{fmt(b.expense)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(b.income - b.expense)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="summary-row">
        <div className="card">
          <div className="card-header"><span className="card-title">แยกตามช่องทาง (รวมทุกสาขา)</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}><Banknote size={16} color="var(--success)" /> เงินสด</div>
              <span style={{ fontWeight: 600 }}>{fmt(cashIn)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}><CreditCard size={16} color="var(--info)" /> เงินโอน (ออนไลน์)</div>
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

function RecordPage({ currentUser, branches }: { currentUser: typeof MOCK_USERS[0], branches: typeof MOCK_BRANCHES }) {
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS)
  const [showForm, setShowForm] = useState(false)
  
  // พนักงานจะถูกล็อคสาขาตัวเอง, แอดมินเลือกได้
  const defaultBranchId = currentUser.role === 'admin' ? (branches[0]?.id || '') : (branches.find(b => b.name === currentUser.branch)?.id || branches[0]?.id || '')
  
  const [form, setForm] = useState({ 
    type: 'income' as 'income' | 'expense', 
    branchId: defaultBranchId,
    category: '', 
    description: '', 
    amount: '', 
    paymentMethod: 'cash' as 'cash' | 'transfer', 
    note: '' 
  })

  const handleSave = () => {
    if (!form.category || !form.amount) return
    const t: Transaction = {
      id: `t-${Date.now()}`, 
      date: new Date().toISOString().split('T')[0],
      branchId: currentUser.role === 'admin' ? form.branchId : defaultBranchId,
      type: form.type, 
      category: form.category, 
      description: form.description,
      amount: parseFloat(form.amount), 
      paymentMethod: form.paymentMethod, 
      note: form.note,
    }
    setTransactions([t, ...transactions])
    setShowForm(false)
    setForm({ type: 'income', branchId: defaultBranchId, category: '', description: '', amount: '', paymentMethod: 'cash', note: '' })
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
          <thead><tr><th>วันที่</th><th>สาขา</th><th>ประเภท</th><th>หมวดหมู่</th><th>รายละเอียด</th><th>ช่องทาง</th><th style={{ textAlign: 'right' }}>จำนวนเงิน</th><th>หมายเหตุ</th></tr></thead>
          <tbody>
            {transactions
              .filter(t => currentUser.role === 'admin' || t.branchId === defaultBranchId)
              .map(t => (
              <tr key={t.id}>
                <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{t.date}</td>
                <td style={{ fontSize: 12, fontWeight: 600 }}>
                  {branches.find(b => b.id === t.branchId)?.name || 'N/A'}
                </td>
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
              <label className="form-label">สาขา</label>
              {currentUser.role === 'admin' ? (
                <select className="form-input" value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })}>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              ) : (
                <input className="form-input" disabled value={currentUser.branch} />
              )}
            </div>

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

function StockPage({ currentUser }: { currentUser: typeof MOCK_USERS[0] }) {
  const filteredStock = currentUser.role === 'admin' 
    ? MOCK_STOCK 
    : MOCK_STOCK.filter(s => {
        // ในระบบจริงจะใช้ branchId ของสินค้า ใน mock นี้เราสมมติว่าบางรายการเป็นของบางสาขา
        // เพื่อให้เห็นผลต่างในการเดโม
        return (currentUser.branch === 'สาขาลาดพร้าว' && s.id.startsWith('s')) || (currentUser.branch === 'สาขาสยาม' && s.qty > 10)
      })

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">สต็อกวัตถุดิบ</h1><p className="page-subtitle">{currentUser.role === 'admin' ? 'จัดการสต็อกรวมทุกสาขา' : `สต็อกของ ${currentUser.branch}`}</p></div></div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>รายการ</th><th>หมวดหมู่</th><th>จำนวน</th><th>ขั้นต่ำ</th><th>หน่วย</th><th>สถานะ</th></tr></thead>
          <tbody>
            {filteredStock.map(s => (
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

function BranchManagePage({ branches, onAddBranch }: { branches: typeof MOCK_BRANCHES, onAddBranch: (b: any) => void }) {
  const [showModal, setShowModal] = useState(false)
  const [newBranch, setNewBranch] = useState({ name: '', address: '', phone: '' })

  const handleCreate = () => {
    if (!newBranch.name) return
    onAddBranch({
      id: `b-${Date.now()}`,
      ...newBranch,
      active: true
    })
    setShowModal(false)
    setNewBranch({ name: '', address: '', phone: '' })
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">จัดการสาขา</h1><p className="page-subtitle">เพิ่ม แก้ไข ปิด/เปิดสาขา</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> เพิ่มสาขาใหม่</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {branches.map(b => (
          <NavLink key={b.id} to={`/admin/branches/${b.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit', opacity: b.active ? 1 : 0.5, cursor: 'pointer' }}>
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
          </NavLink>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">เพิ่มสาขาใหม่</h2>
            <div className="form-group">
              <label className="form-label">ชื่อสาขา</label>
              <input className="form-input" placeholder="เช่น สาขาพระราม 9" value={newBranch.name} onChange={e => setNewBranch({ ...newBranch, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">ที่อยู่</label>
              <input className="form-input" placeholder="ที่อยู่สาขา" value={newBranch.address} onChange={e => setNewBranch({ ...newBranch, address: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">เบอร์โทรศัพท์</label>
              <input className="form-input" placeholder="02-xxx-xxxx" value={newBranch.phone} onChange={e => setNewBranch({ ...newBranch, phone: e.target.value })} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleCreate}>บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BranchDetailPage({ branches }: { branches: typeof MOCK_BRANCHES }) {
  const { id } = useParams<{ id: string }>()
  const branch = branches.find(b => b.id === id)
  const transactions = MOCK_TRANSACTIONS.filter(t => t.branchId === id)
  const branchStock = MOCK_STOCK // ในระบบจริงควร filter ตาม branchId
  
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const cashIn = transactions.filter(t => t.type === 'income' && t.paymentMethod === 'cash').reduce((s, t) => s + t.amount, 0)
  const transferIn = transactions.filter(t => t.type === 'income' && t.paymentMethod === 'transfer').reduce((s, t) => s + t.amount, 0)

  if (!branch) return <div>ไม่พบข้อมูลสาขา</div>

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <NavLink to="/admin/branches" style={{ color: 'var(--text-muted)' }}><Building2 size={16} /></NavLink>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <h1 className="page-title">{branch.name}</h1>
          </div>
          <p className="page-subtitle">{branch.address}</p>
        </div>
        <span className={`badge ${branch.active ? 'badge-success' : 'badge-danger'}`}>{branch.active ? 'เปิดให้บริการ' : 'ปิดชั่วคราว'}</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"><ArrowUpRight size={20} /></div>
          <div><div className="stat-label">รายรับรวม (วันนี้)</div><div className="stat-value" style={{ color: 'var(--success)' }}>{fmt(income)}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Banknote size={20} /></div>
          <div><div className="stat-label">รายรับ (เงินสด)</div><div className="stat-value">{fmt(cashIn)}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><CreditCard size={20} /></div>
          <div><div className="stat-label">รายรับ (ออนไลน์)</div><div className="stat-value" style={{ color: 'var(--info)' }}>{fmt(transferIn)}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><ArrowDownLeft size={20} /></div>
          <div><div className="stat-label">รายจ่ายสะสม</div><div className="stat-value" style={{ color: 'var(--danger)' }}>{fmt(expense)}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><Package size={20} /></div>
          <div><div className="stat-label">สต็อกทั้งหมด</div><div className="stat-value">{branchStock.length} รายการ</div></div>
        </div>
      </div>

      <div className="summary-row">
        <div className="card" style={{ flex: 1.5 }}>
          <div className="card-header"><span className="card-title">สต็อกวัตถุดิบในสาขา</span></div>
          <div className="table-wrapper" style={{ boxShadow: 'none', border: 'none', padding: 0 }}>
            <table style={{ margin: 0 }}>
              <thead><tr><th>รายการ</th><th>จำนวน</th><th>หน่วย</th><th>สถานะ</th></tr></thead>
              <tbody>
                {branchStock.map(s => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td style={{ fontWeight: 700 }}>{s.qty}</td>
                    <td>{s.unit}</td>
                    <td>{s.qty <= s.min ? <span className="badge badge-danger">ต่ำ</span> : <span className="badge badge-success">ปกติ</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card" style={{ flex: 1 }}>
          <div className="card-header"><span className="card-title">ข้อมูลประเภทรายการ</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['ขายอาหาร', 'ขายเครื่องดื่ม', 'ซื้อวัตถุดิบ', 'ค่าใช้จ่ายร้าน'].map(cat => {
              const amt = transactions.filter(t => t.category === cat).reduce((s, t) => s + t.amount, 0)
              return (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{cat}</span>
                  <span style={{ fontWeight: 600 }}>{fmt(amt)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function UsersManagePage({ users, branches, onSaveUser, onDeleteUser }: { users: typeof MOCK_USERS, branches: typeof MOCK_BRANCHES, onSaveUser: (u: any) => void, onDeleteUser: (id: string) => void }) {
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [form, setForm] = useState({ email: '', role: 'staff', branch: '-' })

  const handleAdd = () => {
    setEditingUser(null)
    setForm({ email: '', role: 'staff', branch: branches[0]?.name || '-' })
    setShowModal(true)
  }

  const handleEdit = (u: any) => {
    setEditingUser(u)
    setForm({ email: u.email, role: u.role, branch: u.branch })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.email) return
    onSaveUser({
      id: editingUser ? editingUser.id : `u-${Date.now()}`,
      ...form
    })
    setShowModal(false)
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">จัดการผู้ใช้</h1><p className="page-subtitle">จัดการสิทธิ์และการเข้าถึงของพนักงาน</p></div>
        <button className="btn btn-primary" onClick={handleAdd}><Plus size={16} /> เพิ่มผู้ใช้</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead><tr><th>อีเมล</th><th>บทบาท</th><th>สาขา</th><th style={{ textAlign: 'right' }}>จัดการ</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.email}</td>
                <td><span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-neutral'}`}>{u.role}</span></td>
                <td><span className="tag">{u.branch}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn-icon" title="แก้ไข" onClick={() => handleEdit(u)}><FileText size={14} /></button>
                    <button className="btn-icon delete" title="ลบ" onClick={() => { if(confirm('ยืนยันการลบ?')) onDeleteUser(u.id) }}><AlertTriangle size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <h2 className="modal-title">{editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</h2>
            <div className="form-group">
              <label className="form-label">อีเมล</label>
              <input className="form-input" placeholder="email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">บทบาท</label>
              <select className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="admin">admin</option>
                <option value="staff">staff</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">สาขา</label>
              {form.role === 'admin' ? (
                <input className="form-input" disabled value="-" />
              ) : (
                <select className="form-input" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })}>
                  {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleSave}>บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================
// SIDEBAR + APP
// =============================================
const navItems = [
  { to: '/admin', icon: <LayoutDashboard size={18} />, label: 'Admin Dashboard' },
  { to: '/record', icon: <ClipboardList size={18} />, label: 'บันทึกรายการ' },
  { to: '/stock', icon: <Package size={18} />, label: 'สต็อกวัตถุดิบ' },
  { to: '/stats', icon: <BarChart3 size={18} />, label: 'สถิติรวม' },
  { to: '/summary', icon: <TrendingUp size={18} />, label: 'สรุปรายวัน' },
  { to: '/logs', icon: <FileText size={18} />, label: 'บันทึกกิจกรรม' },
]
const adminItems = [
  { to: '/admin/branches', icon: <Building2 size={18} />, label: 'จัดการสาขา' },
  { to: '/admin/users', icon: <Users size={18} />, label: 'จัดการผู้ใช้' },
]

function SidebarNav({ currentUser, users, onSwitchUser }: { currentUser: typeof MOCK_USERS[0], users: typeof MOCK_USERS, onSwitchUser: (u: any) => void }) {
  const isAdmin = currentUser.role === 'admin'
  const allowedNav = navItems.filter(item => {
    if (isAdmin) return true
    // พนักงานดูได้แค่ บันทึกรายการ และ สต็อก
    return ['/record', '/stock'].includes(item.to)
  })

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1><ShoppingBag size={20} /> ร้านอาหาร</h1>
        <p>ระบบจัดการร้านค้า</p>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-label">เมนูหลัก</div>
        {allowedNav.map(item => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            {item.icon}{item.label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="nav-section-label" style={{ marginTop: 8 }}>จัดการระบบ</div>
            {adminItems.map(item => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                {item.icon}{item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>
      <div className="sidebar-footer">
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
           <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>SWITCH ROLE (DEMO)</div>
           <div style={{ display: 'flex', gap: 4 }}>
             {users.map(u => (
               <button 
                 key={u.id}
                 onClick={() => onSwitchUser(u)}
                 style={{ 
                   flex: 1, padding: '4px 2px', fontSize: 9, borderRadius: 4, border: '1px solid var(--border)',
                   background: currentUser.id === u.id ? 'var(--primary)' : 'white',
                   color: currentUser.id === u.id ? 'white' : 'var(--text-primary)',
                   cursor: 'pointer'
                 }}
               >
                 {u.role}
               </button>
             ))}
           </div>
        </div>
        <div className="user-info">
          <div className="user-avatar">{currentUser.email[0].toUpperCase()}</div>
          <div className="user-details">
            <div className="user-name">{currentUser.email}</div>
            <div className="user-role">{currentUser.role} {currentUser.branch !== '-' ? `(${currentUser.branch})` : ''}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

function App() {
  const [branches, setBranches] = useState(MOCK_BRANCHES)
  const [users, setUsers] = useState(MOCK_USERS)
  const [currentUser, setCurrentUser] = useState(users[0])

  // Sync currentUser if users list changes (for demo)
  useEffect(() => {
    const fresh = users.find(u => u.id === currentUser.id)
    if (fresh) setCurrentUser(fresh)
  }, [users])

  const handleAddBranch = (b: any) => setBranches([...branches, b])
  const handleSaveUser = (u: any) => {
    const exists = users.find(x => x.id === u.id)
    if (exists) setUsers(users.map(x => x.id === u.id ? u : x))
    else setUsers([...users, u])
  }
  const handleDeleteUser = (id: string) => setUsers(users.filter(u => u.id !== id))

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <div className="app-layout">
        <SidebarNav currentUser={currentUser} users={users} onSwitchUser={setCurrentUser} />
        <div className="main-content">
          <div className="page-content">
            <Routes>
              <Route path="/admin" element={currentUser.role === 'admin' ? <AdminDashboardPage branches={branches} /> : <Navigate to="/record" />} />
              <Route path="/record" element={<RecordPage currentUser={currentUser} branches={branches} />} />
              <Route path="/stock" element={<StockPage currentUser={currentUser} />} />
              <Route path="/stats" element={currentUser.role === 'admin' ? <StatsPage /> : <Navigate to="/record" />} />
              <Route path="/summary" element={currentUser.role === 'admin' ? <SummaryPage /> : <Navigate to="/record" />} />
              <Route path="/logs" element={currentUser.role === 'admin' ? <LogsPage /> : <Navigate to="/record" />} />
              <Route path="/admin/branches" element={currentUser.role === 'admin' ? <BranchManagePage branches={branches} onAddBranch={handleAddBranch} /> : <Navigate to="/record" />} />
              <Route path="/admin/branches/:id" element={currentUser.role === 'admin' ? <BranchDetailPage branches={branches} /> : <Navigate to="/record" />} />
              <Route path="/admin/users" element={currentUser.role === 'admin' ? <UsersManagePage users={users} branches={branches} onSaveUser={handleSaveUser} onDeleteUser={handleDeleteUser} /> : <Navigate to="/record" />} />
              <Route path="*" element={<Navigate to={currentUser.role === 'admin' ? "/admin" : "/record"} replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App

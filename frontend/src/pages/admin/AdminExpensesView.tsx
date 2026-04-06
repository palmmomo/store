import { useState, useEffect } from 'react'
import { expensesApi, branchApi } from '../../api/client'
import { FileText, Building2, Calendar, Filter } from 'lucide-react'

interface Expense {
  id: number
  title: string
  amount: number
  note: string
  expense_date: string
  branch_id?: string
  branches?: { name: string }
  user_email?: string
  users?: { email: string }
}

interface Branch {
  id: string
  name: string
}

export default function AdminExpensesView() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

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

  const loadBranches = async () => {
    try {
      const res = await branchApi.getAll()
      setBranches(res?.data || [])
    } catch (err) {
      console.error('Load branches error:', err)
      setBranches([])
    }
  }

  useEffect(() => {
    loadExpenses()
    loadBranches()
  }, [])

  // Filter expenses based on selected filters
  const filteredExpenses = expenses.filter(expense => {
    // Filter by branch
    if (selectedBranch && expense?.branch_id !== selectedBranch) {
      return false
    }
    
    // Filter by date range
    if (dateFrom || dateTo) {
      const expenseDate = new Date(expense?.expense_date || '')
      if (dateFrom && expenseDate < new Date(dateFrom)) return false
      if (dateTo && expenseDate > new Date(dateTo + 'T23:59:59')) return false
    }
    
    return true
  })

  // Calculate total
  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + (parseFloat(String(exp?.amount)) || 0), 0)

  // Format date to Buddhist Era
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear() + 543
    return `${day}/${month}/${year}`
  }

  // Format amount
  const formatAmount = (amount: number) => {
    const num = Math.abs(parseFloat(String(amount)) || 0)
    return num.toLocaleString('th-TH')
  }

  // Get branch name
  const getBranchName = (expense: Expense) => {
    return expense?.branches?.name || expense?.branch_id?.slice(0, 8) || '-'
  }

  // Get user email
  const getUserEmail = (expense: Expense) => {
    return expense?.user_email || expense?.users?.email || '-'
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">
            <FileText size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            รายจ่ายทั้งหมด
          </h1>
          <p className="page-subtitle">ดูประวัติรายจ่ายรวมทุกสาขา (ดูอย่างเดียว)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
            <label className="form-label">
              <Building2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              กรองตามสาขา
            </label>
            <select 
              className="form-input" 
              value={selectedBranch} 
              onChange={e => setSelectedBranch(e.target.value)}
            >
              <option value="">-- ทุกสาขา --</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
            <label className="form-label">
              <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              ตั้งแต่วันที่
            </label>
            <input 
              type="date" 
              className="form-input" 
              value={dateFrom} 
              onChange={e => setDateFrom(e.target.value)} 
            />
          </div>
          
          <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
            <label className="form-label">
              <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              ถึงวันที่
            </label>
            <input 
              type="date" 
              className="form-input" 
              value={dateTo} 
              onChange={e => setDateTo(e.target.value)} 
            />
          </div>
          
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              setSelectedBranch('')
              setDateFrom('')
              setDateTo('')
            }}
            style={{ height: 40 }}
          >
            <Filter size={14} /> ล้างตัวกรอง
          </button>
        </div>
        
        {/* Summary */}
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          background: 'var(--bg-box)', 
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: 'var(--text-muted)' }}>
            แสดง {filteredExpenses.length} รายการ จากทั้งหมด {expenses.length} รายการ
          </span>
          <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--primary)' }}>
            ยอดรวม: {formatAmount(totalAmount)} บาท
          </span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>วันที่</th>
                <th>สาขา</th>
                <th>ผู้บันทึก</th>
                <th>รายการ</th>
                <th style={{ textAlign: 'right' }}>จำนวนเงิน</th>
                <th>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>
                    <p style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p>
                  </td>
                </tr>
              ) : filteredExpenses?.length > 0 ? (
                filteredExpenses.map(exp => (
                  <tr key={exp?.id}>
                    <td style={{ fontSize: 13 }}>{formatDate(exp?.expense_date)}</td>
                    <td>
                      <span className="badge badge-secondary" style={{ fontSize: 12 }}>
                        {getBranchName(exp)}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {getUserEmail(exp)}
                    </td>
                    <td style={{ fontWeight: 500 }}>{exp?.title || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--danger)' }}>
                      ฿{formatAmount(exp?.amount)} บาท
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {exp?.note || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                    ไม่พบข้อมูลรายจ่าย
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { billApi } from '../api/client'
import type { Bill } from '../types'
import {
  Receipt, Plus, Pencil, Trash2, X, Upload, FileText,
  Calendar, Filter, DollarSign, TrendingUp, Download, Eye, Paperclip
} from 'lucide-react'
import toast from 'react-hot-toast'
import { compressImage } from '../utils/compressImage'

const CATEGORIES = ['ค่าไฟ', 'ค่าน้ำ', 'อุปกรณ์', 'ค่าขนส่ง', 'ค่าแรง', 'ค่าวัสดุ', 'ค่าเช่า', 'อื่นๆ']

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editBill, setEditBill] = useState<Bill | null>(null)
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [filterCategory, setFilterCategory] = useState('')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    description: '',
    amount: '',
    bill_date: new Date().toISOString().split('T')[0],
    category: 'อื่นๆ',
    note: '',
  })

  const fetchBills = async () => {
    try {
      const params: { month?: string; category?: string } = {}
      if (filterMonth) params.month = filterMonth
      if (filterCategory) params.category = filterCategory
      const res = await billApi.getAll(params)
      setBills(res.data || [])
    } catch {
      toast.error('โหลดข้อมูลบิลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBills() }, [filterMonth, filterCategory])

  const openAdd = () => {
    setEditBill(null)
    setForm({
      description: '',
      amount: '',
      bill_date: new Date().toISOString().split('T')[0],
      category: 'อื่นๆ',
      note: '',
    })
    setAttachmentFile(null)
    setAttachmentPreview(null)
    setShowModal(true)
  }

  const openEdit = (bill: Bill) => {
    setEditBill(bill)
    setForm({
      description: bill.description,
      amount: String(bill.amount),
      bill_date: bill.bill_date,
      category: bill.category,
      note: bill.note || '',
    })
    setAttachmentFile(null)
    setAttachmentPreview(bill.attachment_url || null)
    setShowModal(true)
  }

  const save = async () => {
    if (!form.description.trim()) { toast.error('กรอกรายการ'); return }
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error('กรอกจำนวนเงิน'); return }
    if (!form.bill_date) { toast.error('กรอกวันที่'); return }

    try {
      if (editBill) {
        await billApi.update(editBill.id, {
          description: form.description,
          amount: parseFloat(form.amount),
          bill_date: form.bill_date,
          category: form.category,
          note: form.note,
        })
        if (attachmentFile) {
          await billApi.uploadAttachment(editBill.id, attachmentFile)
        }
        toast.success('แก้ไขบิลสำเร็จ')
      } else {
        const fd = new FormData()
        fd.append('description', form.description)
        fd.append('amount', form.amount)
        fd.append('bill_date', form.bill_date)
        fd.append('category', form.category)
        fd.append('note', form.note)
        if (attachmentFile) {
          fd.append('attachment', attachmentFile)
        }
        await billApi.create(fd)
        toast.success('เพิ่มบิลสำเร็จ')
      }
      setShowModal(false)
      fetchBills()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'บันทึกไม่สำเร็จ')
    }
  }

  const del = async (bill: Bill) => {
    if (!confirm(`ยืนยันลบบิล "${bill.description}" จำนวน ฿${Number(bill.amount).toLocaleString()}?`)) return
    try {
      await billApi.delete(bill.id)
      toast.success('ลบบิลสำเร็จ')
      fetchBills()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'ลบไม่สำเร็จ')
    }
  }

  const viewAttachment = async (bill: Bill) => {
    if (!bill.attachment_url) return
    try {
      const res = await billApi.getAttachmentUrl(bill.id)
      const url = res.data?.url || bill.attachment_url
      if (bill.attachment_url.endsWith('.pdf')) {
        window.open(url, '_blank')
      } else {
        setLightboxUrl(url)
      }
    } catch {
      // Fallback to direct URL
      if (bill.attachment_url.endsWith('.pdf')) {
        window.open(bill.attachment_url, '_blank')
      } else {
        setLightboxUrl(bill.attachment_url)
      }
    }
  }

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleFileSelect = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      toast.error('รองรับเฉพาะ JPEG, PNG, WebP และ PDF')
      return
    }
    // PDF: check size limit, no compression
    if (file.type === 'application/pdf') {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('ขนาด PDF ไม่เกิน 10MB')
        return
      }
      setAttachmentFile(file)
      setAttachmentPreview('pdf')
      return
    }
    // Image: compress before storing
    try {
      const compressed = await compressImage(file, 2, 1920)
      setAttachmentFile(compressed)
      const reader = new FileReader()
      reader.onload = (e) => setAttachmentPreview(e.target?.result as string)
      reader.readAsDataURL(compressed)
    } catch {
      toast.error('บีบอัดรูปไม่สำเร็จ')
    }
  }

  // Summary calculations
  const totalAmount = bills.reduce((s, b) => s + Number(b.amount), 0)
  const billCount = bills.length
  const avgAmount = billCount > 0 ? totalAmount / billCount : 0

  // Category breakdown
  const categoryTotals = bills.reduce((acc, b) => {
    acc[b.category] = (acc[b.category] || 0) + Number(b.amount)
    return acc
  }, {} as Record<string, number>)
  const maxCategoryTotal = Math.max(...Object.values(categoryTotals), 1)

  const fmtAmount = (n: number) => `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const fmtDate = (d: string) => {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
    } catch { return d }
  }

  const monthLabel = filterMonth ? (() => {
    const [y, m] = filterMonth.split('-')
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
    return `${months[parseInt(m) - 1]} ${y}`
  })() : 'ทั้งหมด'

  return (
    <div className="bleed-page" style={{ background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', minHeight: 'calc(100vh - 60px)' }}>
      {/* Header */}
      <div className="page-header" style={{ background: 'white', padding: '20px 24px', borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: 24 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 24, color: '#1e293b' }}>
            <Receipt size={28} color="#10b981" /> จัดการบิล
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>บันทึกค่าใช้จ่ายและใบเสร็จ — {monthLabel}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} style={{ background: '#10b981', border: 'none', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
          <Plus size={16} /> เพิ่มบิล
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} color="#ef4444" />
            </div>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>ค่าใช้จ่ายรวม</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444' }}>{fmtAmount(totalAmount)}</div>
        </div>
        <div style={{ background: 'white', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} color="#22c55e" />
            </div>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>จำนวนบิล</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{billCount} <span style={{ fontSize: 14, fontWeight: 400, color: '#94a3b8' }}>รายการ</span></div>
        </div>
        <div style={{ background: 'white', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="#3b82f6" />
            </div>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>เฉลี่ยต่อบิล</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#3b82f6' }}>{fmtAmount(avgAmount)}</div>
        </div>
      </div>

      {/* Category Chart */}
      {Object.keys(categoryTotals).length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#334155', marginBottom: 16 }}>ค่าใช้จ่ายตามประเภท</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([cat, total]) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 80, fontSize: 13, fontWeight: 500, color: '#475569', flexShrink: 0, textAlign: 'right' }}>{cat}</span>
                <div style={{ flex: 1, height: 28, background: '#f1f5f9', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    height: '100%',
                    width: `${(total / maxCategoryTotal) * 100}%`,
                    background: 'linear-gradient(90deg, #10b981, #34d399)',
                    borderRadius: 8,
                    transition: 'width 0.5s ease',
                    minWidth: 40,
                  }} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: '#334155' }}>
                    {fmtAmount(total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', padding: '8px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <Calendar size={16} color="#64748b" />
          <input
            type="month"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 13, fontWeight: 500, color: '#334155', background: 'transparent', cursor: 'pointer' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', padding: '8px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <Filter size={16} color="#64748b" />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 13, fontWeight: 500, color: '#334155', background: 'transparent', cursor: 'pointer' }}
          >
            <option value="">ทุกประเภท</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {(filterMonth || filterCategory) && (
          <button onClick={() => { setFilterMonth(''); setFilterCategory('') }} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            <X size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> ล้าง
          </button>
        )}
      </div>

      {/* Bills Table */}
      <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>กำลังโหลด...</div>
        ) : bills.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <Receipt size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <p style={{ color: '#94a3b8', fontSize: 14 }}>ไม่มีบิลในช่วงที่เลือก</p>
            <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: 12, background: '#10b981', border: 'none' }}>
              <Plus size={16} /> เพิ่มบิลแรก
            </button>
          </div>
        ) : (
          <div className="responsive-table" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>วันที่</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>รายการ</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>ประเภท</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>จำนวนเงิน</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>แนบ</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, width: 100 }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill, idx) => (
                  <tr key={bill.id} style={{ borderTop: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafbfc', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#fafbfc')}
                    data-label-date={fmtDate(bill.bill_date)}
                    data-label-desc={bill.description}
                    data-label-cat={bill.category}
                    data-label-amount={fmtAmount(Number(bill.amount))}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569', fontWeight: 500 }}>{fmtDate(bill.bill_date)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{bill.description}</div>
                      {bill.note && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{bill.note}</div>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 600,
                        background: '#f1f5f9', color: '#475569'
                      }}>{bill.category}</span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#ef4444' }}>
                      {fmtAmount(Number(bill.amount))}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {bill.attachment_url ? (
                        <button onClick={() => viewAttachment(bill)} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500 }}>
                          <Eye size={14} /> ดู
                        </button>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button onClick={() => openEdit(bill)} style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#0284c7' }}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => del(bill)} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#dc2626' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                  <td colSpan={3} style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: '#334155', textAlign: 'right' }}>รวมทั้งหมด</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: 16, fontWeight: 800, color: '#ef4444' }}>{fmtAmount(totalAmount)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Receipt size={20} color="#10b981" /> {editBill ? 'แก้ไขบิล' : 'เพิ่มบิลใหม่'}
            </h3>
            <div className="form-group">
              <label className="form-label">รายการ *</label>
              <input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="เช่น ค่าไฟเดือนพฤษภาคม" autoFocus />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">จำนวนเงิน (บาท) *</label>
                <input className="form-input qty-input" type="number" inputMode="decimal" min="0" step="any" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">วันที่ *</label>
                <input className="form-input" type="date" value={form.bill_date} onChange={e => setForm({ ...form, bill_date: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">ประเภท</label>
              <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">หมายเหตุ</label>
              <textarea className="form-input" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={2} style={{ resize: 'vertical', fontFamily: 'inherit' }} placeholder="รายละเอียดเพิ่มเติม..." />
            </div>

            {/* File Upload Zone */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Paperclip size={14} /> แนบใบเสร็จ (รูปภาพ/PDF)
              </label>
              <div
                className={`file-upload-zone ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive ? '#10b981' : '#d1d5db'}`,
                  borderRadius: 12,
                  padding: attachmentPreview ? '12px' : '24px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragActive ? '#f0fdf4' : '#fafafa',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                  style={{ display: 'none' }}
                />
                {attachmentPreview ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    {attachmentPreview === 'pdf' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#fee2e2', borderRadius: 8 }}>
                        <FileText size={20} color="#dc2626" />
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#991b1b' }}>{attachmentFile?.name || 'PDF File'}</span>
                      </div>
                    ) : (
                      <img src={attachmentPreview} alt="Preview" style={{ maxHeight: 120, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }} />
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setAttachmentFile(null); setAttachmentPreview(null) }}
                      style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={24} color="#94a3b8" style={{ marginBottom: 8 }} />
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>ลากไฟล์มาวาง หรือคลิกเพื่อเลือก</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>รูป: บีบอัดอัตโนมัติ / PDF: สูงสุด 10MB</p>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn" onClick={() => setShowModal(false)} style={{ minHeight: 44 }}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={save} style={{ minHeight: 44, background: '#10b981', border: 'none' }}>{editBill ? 'บันทึก' : 'เพิ่มบิล'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="modal-overlay" onClick={() => setLightboxUrl(null)} style={{ background: 'rgba(0,0,0,0.85)', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button
              onClick={() => setLightboxUrl(null)}
              style={{ position: 'absolute', top: -12, right: -12, width: 32, height: 32, borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', zIndex: 10 }}
            >
              <X size={16} />
            </button>
            <img src={lightboxUrl} alt="ใบเสร็จ" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain' }} />
            <a href={lightboxUrl} download style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 12, color: 'white', fontSize: 13, textDecoration: 'none' }}>
              <Download size={14} /> ดาวน์โหลด
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

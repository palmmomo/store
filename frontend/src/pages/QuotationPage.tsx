import { useState, useEffect, useCallback, useRef } from 'react'
import { quotationApi, branchApi } from '../api/client'
import type { Quotation, QuotationItem, Branch } from '../types'
import { FileText, Plus, Pencil, Trash2, Download, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import ThaiBahtText from 'thai-baht-text'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const statusLabels: Record<string, string> = { draft: 'แบบร่าง', sent: 'ส่งแล้ว', approved: 'อนุมัติ' }
const statusColors: Record<string, string> = { draft: '#94a3b8', sent: '#3b82f6', approved: '#10b981' }

export default function QuotationPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editQ, setEditQ] = useState<Quotation | null>(null)
  const [showCreateJobModal, setShowCreateJobModal] = useState<number | null>(null) // quotation id
  const printRef = useRef<HTMLDivElement>(null)
  const [printQ, setPrintQ] = useState<Quotation | null>(null)

  const emptyItem = (): QuotationItem => ({ description: '', quantity: 1, price_per_unit: 0, total: 0 })
  const [form, setForm] = useState({
    branch_id: '', customer_name: '', customer_address: '', customer_tax_id: '', status: 'draft',
    items: [emptyItem()] as QuotationItem[],
  })

  const fetchAll = useCallback(async () => {
    try {
      const [q, b] = await Promise.all([quotationApi.getAll(), branchApi.getAll()])
      setQuotations(q.data || [])
      setBranches(b.data || [])
    } catch { toast.error('โหลดข้อมูลไม่สำเร็จ') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchAll() }, [fetchAll])

  const totalAmount = form.items.reduce((s, i) => s + (Number(i.total) || 0), 0)

  const updateItem = (idx: number, field: keyof QuotationItem, val: string) => {
    const newItems = [...form.items]
    const item = { ...newItems[idx] }
    if (field === 'description') {
      item.description = val
    } else if (field === 'quantity') {
      item.quantity = val === '' ? 0 : parseFloat(val) || 0
      item.total = item.quantity * item.price_per_unit
    } else if (field === 'price_per_unit') {
      item.price_per_unit = val === '' ? 0 : parseFloat(val) || 0
      item.total = item.quantity * item.price_per_unit
    }
    newItems[idx] = item
    setForm({ ...form, items: newItems })
  }

  const addRow = () => setForm({ ...form, items: [...form.items, emptyItem()] })
  const removeRow = (idx: number) => { if (form.items.length > 1) setForm({ ...form, items: form.items.filter((_, i) => i !== idx) }) }

  const openAdd = () => {
    setEditQ(null)
    setForm({ branch_id: branches[0]?.id?.toString() || '', customer_name: '', customer_address: '', customer_tax_id: '', status: 'draft', items: [emptyItem()] })
    setShowModal(true)
  }
  const openEdit = (q: Quotation) => {
    setEditQ(q)
    setForm({ branch_id: String(q.branch_id || ''), customer_name: q.customer_name, customer_address: q.customer_address, customer_tax_id: q.customer_tax_id, status: q.status, items: q.items?.length ? q.items : [emptyItem()] })
    setShowModal(true)
  }

  const save = async () => {
    const total = form.items.reduce((s, i) => s + (Number(i.total) || 0), 0)
    let words = ''
    try { words = ThaiBahtText(total) } catch { words = '' }
    const payload = { branch_id: parseInt(form.branch_id) || 0, customer_name: form.customer_name, customer_address: form.customer_address, customer_tax_id: form.customer_tax_id, items: form.items, total_amount: total, total_in_words: words, status: form.status }
    try {
      let savedQ: Quotation | null = null
      if (editQ) {
        await quotationApi.update(editQ.id, payload)
        toast.success('แก้ไขสำเร็จ')
      } else {
        const res = await quotationApi.create(payload)
        savedQ = res.data as Quotation
        toast.success('สร้างสำเร็จ')
        // Prompt to create job
        if (savedQ?.id) {
          setShowCreateJobModal(savedQ.id)
        }
      }
      setShowModal(false)
      fetchAll()
    } catch { toast.error('บันทึกไม่สำเร็จ') }
  }

  const createJobFromQuotation = async (qId: number) => {
    try {
      await quotationApi.createJob(qId)
      toast.success('สร้างงานสำเร็จ')
    } catch { toast.error('สร้างงานไม่สำเร็จ') }
    setShowCreateJobModal(null)
  }

  const del = async (id: number) => {
    if (!confirm('ลบใบเสนอราคานี้?')) return
    try { await quotationApi.delete(id); toast.success('ลบสำเร็จ'); fetchAll() } catch (err: any) { toast.error(err.response?.data?.error || 'ลบไม่สำเร็จ') }
  }

  const exportPDF = async (q: Quotation) => {
    setPrintQ(q)
    // Wait for render
    await new Promise(r => setTimeout(r, 300))
    const el = printRef.current
    if (!el) { toast.error('ไม่สามารถสร้าง PDF ได้'); return }
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pw = pdf.internal.pageSize.getWidth()
      const ph = (canvas.height * pw) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pw, ph)
      pdf.save(`${q.quotation_no}.pdf`)
      toast.success('ดาวน์โหลด PDF สำเร็จ')
    } catch { toast.error('สร้าง PDF ไม่สำเร็จ') }
    setPrintQ(null)
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
  const fmtNum = (n: number) => n?.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'

  const printBranch = printQ ? branches.find(b => b.id === printQ.branch_id) : null
  const printItems = printQ?.items || []
  let printTotalWords = ''
  try { printTotalWords = ThaiBahtText(printQ?.total_amount || 0) } catch { printTotalWords = printQ?.total_in_words || '' }

  return (
    <div>
      <div className="page-header">
        <div><h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={22} /> ใบเสนอราคา</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>สร้างและจัดการใบเสนอราคา</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> สร้างใบเสนอราคา</button>
      </div>

      <div className="card">
        {loading ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>กำลังโหลด...</p> :
        quotations.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>ยังไม่มีใบเสนอราคา</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table responsive-table"><thead><tr><th>เลขที่</th><th>ลูกค้า</th><th>สาขา</th><th style={{ textAlign: 'right' }}>ยอดรวม</th><th>สถานะ</th><th>วันที่</th><th style={{ textAlign: 'center' }}>จัดการ</th></tr></thead>
            <tbody>{quotations.map(q => (
              <tr key={q.id}>
                <td data-label="เลขที่" style={{ fontWeight: 600, fontSize: 12 }}>{q.quotation_no}</td>
                <td data-label="ลูกค้า">{q.customer_name || '-'}</td>
                <td data-label="สาขา" style={{ fontSize: 12 }}>{q.branches?.name || '-'}</td>
                <td data-label="ยอดรวม" style={{ textAlign: 'right', fontWeight: 600 }}>฿{fmtNum(q.total_amount)}</td>
                <td data-label="สถานะ"><span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: 'white', background: statusColors[q.status] || '#94a3b8' }}>{statusLabels[q.status] || q.status}</span></td>
                <td data-label="วันที่" style={{ fontSize: 12 }}>{fmtDate(q.created_at)}</td>
                <td data-label="จัดการ" style={{ textAlign: 'center' }}><div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                  <button className="btn btn-sm" onClick={() => exportPDF(q)} title="PDF"><Download size={14} /></button>
                  <button className="btn btn-sm" onClick={() => setShowCreateJobModal(q.id)} title="สร้างงาน"><Briefcase size={14} /></button>
                  <button className="btn btn-sm" onClick={() => openEdit(q)}><Pencil size={14} /></button>
                  <button className="btn btn-sm btn-danger" onClick={() => del(q.id)}><Trash2 size={14} /></button>
                </div></td>
              </tr>
            ))}</tbody></table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 700, maxHeight: '90vh', overflow: 'auto' }}>
          <h3 style={{ marginBottom: 16 }}>{editQ ? 'แก้ไขใบเสนอราคา' : 'สร้างใบเสนอราคาใหม่'}</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group"><label className="form-label">สาขา</label>
              <select className="form-input" value={form.branch_id} onChange={e => setForm({ ...form, branch_id: e.target.value })}>
                <option value="">-- เลือกสาขา --</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">สถานะ</label>
              <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="draft">แบบร่าง</option><option value="sent">ส่งแล้ว</option><option value="approved">อนุมัติ</option>
              </select>
            </div>
          </div>

          <div className="form-group"><label className="form-label">ชื่อลูกค้า</label><input className="form-input" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">ที่อยู่ลูกค้า</label><input className="form-input" value={form.customer_address} onChange={e => setForm({ ...form, customer_address: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">เลขผู้เสียภาษีลูกค้า</label><input className="form-input" value={form.customer_tax_id} onChange={e => setForm({ ...form, customer_tax_id: e.target.value })} /></div>

          <div style={{ marginTop: 16, marginBottom: 8 }}><label className="form-label">รายการสินค้า</label></div>
          <div className="table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="data-table quotation-items-table" style={{ fontSize: 12 }}>
              <thead><tr><th style={{ width: 30 }}>ที่</th><th>รายการ</th><th style={{ width: 80 }}>จำนวน</th><th style={{ width: 100 }}>ราคา/หน่วย</th><th style={{ width: 100 }}>จำนวนเงิน</th><th style={{ width: 30 }}></th></tr></thead>
              <tbody>{form.items.map((item, idx) => (
                <tr key={idx} className="quotation-item-row">
                  <td data-label="ที่">{idx + 1}</td>
                  <td data-label="รายการ"><div className="field-label">รายการ</div><input className="form-input" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} style={{ fontSize: 12, padding: '4px 8px' }} /></td>
                  <td data-label="จำนวน"><div className="field-label">จำนวน</div><input className="form-input qty-input" type="number" inputMode="decimal" min="0" step="any" value={item.quantity || ''} onChange={e => updateItem(idx, 'quantity', e.target.value)} style={{ fontSize: 12, padding: '4px 8px', textAlign: 'right' }} /></td>
                  <td data-label="ราคา/หน่วย"><div className="field-label">ราคา/หน่วย</div><input className="form-input qty-input" type="number" inputMode="decimal" min="0" step="any" value={item.price_per_unit || ''} onChange={e => updateItem(idx, 'price_per_unit', e.target.value)} style={{ fontSize: 12, padding: '4px 8px', textAlign: 'right' }} /></td>
                  <td data-label="จำนวนเงิน" style={{ textAlign: 'right', fontWeight: 600 }}>{fmtNum(Number(item.total) || 0)}</td>
                  <td><button className="btn btn-sm btn-danger delete-btn" onClick={() => removeRow(idx)} style={{ padding: 2 }}><Trash2 size={12} /></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <button className="btn" onClick={addRow} style={{ marginTop: 8, fontSize: 12 }}><Plus size={14} /> เพิ่มรายการ</button>

          <div style={{ background: '#f0fdf4', padding: '10px 14px', borderRadius: 8, marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15 }}>
              <span>รวมสุทธิ</span><span>฿{fmtNum(totalAmount)}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              ({totalAmount > 0 ? (() => { try { return ThaiBahtText(totalAmount) } catch { return '' } })() : '-'})
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="btn" onClick={() => setShowModal(false)}>ยกเลิก</button>
            <button className="btn btn-primary" onClick={save}>{editQ ? 'บันทึก' : 'สร้าง'}</button>
          </div>
        </div></div>
      )}

      {/* Create Job from Quotation Modal */}
      {showCreateJobModal !== null && (
        <div className="modal-overlay" onClick={() => setShowCreateJobModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
            <Briefcase size={40} style={{ color: 'var(--primary)', marginBottom: 12 }} />
            <h3 style={{ marginBottom: 8 }}>สร้างงานอัตโนมัติ</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>ต้องการสร้างงานในการดำเนินงานจากใบเสนอราคานี้หรือไม่?</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn" onClick={() => setShowCreateJobModal(null)}>ไม่ใช่</button>
              <button className="btn btn-primary" onClick={() => createJobFromQuotation(showCreateJobModal)}>ใช่ — สร้างงาน</button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden print area for PDF */}
      {printQ && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
          <div ref={printRef} id="quotation-print" style={{ fontFamily: "'Sarabun', sans-serif", width: 794, padding: '40px 50px', background: 'white', color: 'black', fontSize: 14, lineHeight: 1.6 }}>
            {/* Company header */}
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{printBranch?.name || 'บริษัท'}</div>
              {printBranch?.address && <div style={{ fontSize: 12, color: '#444' }}>{printBranch.address}</div>}
              <div style={{ fontSize: 12, color: '#444' }}>
                {printBranch?.phone && `โทร. ${printBranch.phone}`}
                {printBranch?.tax_id && ` | เลขที่ผู้เสียภาษี: ${printBranch.tax_id}`}
              </div>
            </div>
            <hr style={{ border: 'none', borderTop: '2px solid #333', margin: '12px 0' }} />

            <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, margin: '10px 0' }}>ใบเสนอราคา / QUOTATION</div>

            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '12px 0', fontSize: 13 }}>
              <div>
                <div><b>ผู้ซื้อ/Customer:</b> {printQ.customer_name || '-'}</div>
                <div><b>ที่อยู่/Address:</b> {printQ.customer_address || '-'}</div>
                {printQ.customer_tax_id && <div><b>เลขประจำตัวผู้เสียภาษี:</b> {printQ.customer_tax_id}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><b>เลขที่:</b> {printQ.quotation_no}</div>
                <div><b>วันที่/Date:</b> {new Date(printQ.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
              </div>
            </div>

            {/* Items table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16, fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #999', padding: '6px 8px', width: 40, textAlign: 'center' }}>ที่<br /><span style={{ fontSize: 10 }}>Item</span></th>
                  <th style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'left' }}>รายการ<br /><span style={{ fontSize: 10 }}>Description</span></th>
                  <th style={{ border: '1px solid #999', padding: '6px 8px', width: 70, textAlign: 'center' }}>จำนวน<br /><span style={{ fontSize: 10 }}>Quantity</span></th>
                  <th style={{ border: '1px solid #999', padding: '6px 8px', width: 90, textAlign: 'right' }}>ราคา/หน่วย<br /><span style={{ fontSize: 10 }}>Price/Unit</span></th>
                  <th style={{ border: '1px solid #999', padding: '6px 8px', width: 100, textAlign: 'right' }}>จำนวนเงิน<br /><span style={{ fontSize: 10 }}>Amount/Baht</span></th>
                </tr>
              </thead>
              <tbody>
                {printItems.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #999', padding: '5px 8px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #999', padding: '5px 8px' }}>{item.description || '-'}</td>
                    <td style={{ border: '1px solid #999', padding: '5px 8px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ border: '1px solid #999', padding: '5px 8px', textAlign: 'right' }}>{fmtNum(item.price_per_unit)}</td>
                    <td style={{ border: '1px solid #999', padding: '5px 8px', textAlign: 'right' }}>{fmtNum(Number(item.total) || 0)}</td>
                  </tr>
                ))}
                {/* Empty rows to fill */}
                {Array.from({ length: Math.max(0, 5 - printItems.length) }).map((_, idx) => (
                  <tr key={`empty-${idx}`}>
                    <td style={{ border: '1px solid #999', padding: '5px 8px', height: 28 }}>&nbsp;</td>
                    <td style={{ border: '1px solid #999', padding: '5px 8px' }}></td>
                    <td style={{ border: '1px solid #999', padding: '5px 8px' }}></td>
                    <td style={{ border: '1px solid #999', padding: '5px 8px' }}></td>
                    <td style={{ border: '1px solid #999', padding: '5px 8px' }}></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8f8f8' }}>
                  <td colSpan={3} style={{ border: '1px solid #999', padding: '8px', fontSize: 12 }}>
                    <b>ตัวอักษร/In Letter:</b> {printTotalWords}
                  </td>
                  <td style={{ border: '1px solid #999', padding: '8px', textAlign: 'right', fontWeight: 700 }}>รวมสุทธิ<br /><span style={{ fontSize: 10 }}>Grand Total</span></td>
                  <td style={{ border: '1px solid #999', padding: '8px', textAlign: 'right', fontWeight: 700, fontSize: 15 }}>{fmtNum(printQ.total_amount)}</td>
                </tr>
              </tfoot>
            </table>

            {/* Signature */}
            <div style={{ marginTop: 60, textAlign: 'right', paddingRight: 60 }}>
              <div style={{ fontSize: 13 }}>ผู้เสนอราคา</div>
              <div style={{ marginTop: 40, fontSize: 13 }}>(................................)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { quotationApi, branchApi, quoteTemplateApi } from '../api/client'
import type { Quotation, QuotationItem, Branch } from '../types'
import { FileText, Plus, Pencil, Trash2, Download, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import ThaiBahtText from 'thai-baht-text'
import { jsPDF } from 'jspdf'
// NOTE: fabric is loaded dynamically in exportPDF() to avoid blocking the main thread

const statusLabels: Record<string, string> = { draft: 'แบบร่าง', sent: 'ส่งแล้ว', approved: 'อนุมัติ' }
const statusColors: Record<string, string> = { draft: '#94a3b8', sent: '#3b82f6', approved: '#10b981' }

export default function QuotationPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editQ, setEditQ] = useState<Quotation | null>(null)
  const [showCreateJobModal, setShowCreateJobModal] = useState<number | null>(null) // quotation id

  const emptyItem = (): QuotationItem => ({ description: '', quantity: 1, price_per_unit: 0, total: 0 })
  const [form, setForm] = useState({
    branch_id: '', customer_name: '', customer_address: '', customer_tax_id: '', status: 'draft', prepared_by: '',
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
    setForm({ branch_id: branches[0]?.id?.toString() || '', customer_name: '', customer_address: '', customer_tax_id: '', status: 'draft', prepared_by: '', items: [emptyItem()] })
    setShowModal(true)
  }
  const openEdit = (q: Quotation) => {
    setEditQ(q)
    setForm({ branch_id: String(q.branch_id || ''), customer_name: q.customer_name, customer_address: q.customer_address, customer_tax_id: q.customer_tax_id, status: q.status, prepared_by: q.prepared_by || '', items: q.items?.length ? q.items : [emptyItem()] })
    setShowModal(true)
  }

  const handleBranchSelect = async (bId: string) => {
    setForm(prev => ({ ...prev, branch_id: bId }))
    if (!bId) return
    try {
      const res = await quoteTemplateApi.get(parseInt(bId))
      if (!res.data?.canvas_json) {
        toast.error('สาขานี้ยังไม่มีแบบใบเสนอราคา กรุณาสร้างแบบก่อน', { duration: 4000 })
      } else {
        toast.success('ดึงแบบใบเสนอราคาของสาขาเรียบร้อย')
      }
    } catch {
      toast.error('สาขานี้ยังไม่มีแบบใบเสนอราคา กรุณาสร้างแบบก่อน', { duration: 4000 })
    }
  }

  const save = async () => {
    const total = form.items.reduce((s, i) => s + (Number(i.total) || 0), 0)
    let words = ''
    try { words = ThaiBahtText(total) } catch { words = '' }
    const payload = { branch_id: parseInt(form.branch_id) || 0, customer_name: form.customer_name, customer_address: form.customer_address, customer_tax_id: form.customer_tax_id, prepared_by: form.prepared_by, items: form.items, total_amount: total, total_in_words: words, status: form.status }
    try {
      let savedQ: Quotation | null = null
      if (editQ) {
        await quotationApi.update(editQ.id, payload)
        toast.success('แก้ไขสำเร็จ')
      } else {
        const res = await quotationApi.create(payload)
        savedQ = res.data as Quotation
        toast.success('สร้างสำเร็จ')
        // Prompt to create jobs (one per line item)
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
      toast.success('สร้างงานสำเร็จ (สร้างตามจำนวนรายการ)')
    } catch { toast.error('สร้างงานไม่สำเร็จ') }
    setShowCreateJobModal(null)
  }

  const del = async (q: Quotation) => {
    if (!window.confirm(`ยืนยันลบใบเสนอราคา ${q.quotation_no}?\nงานที่เชื่อมอยู่จะถูกตัด link ออก (งานยังคงอยู่)`)) return
    try { 
      await quotationApi.delete(q.id)
      toast.success('ลบสำเร็จ')
      fetchAll() 
    } catch (err: any) { 
      toast.error(err.response?.data?.error || 'ลบไม่สำเร็จ') 
    }
  }

  const exportPDF = async (q: Quotation) => {
    const loadingId = toast.loading('กำลังสร้าง PDF...')
    try {
      // Dynamic import to avoid blocking main thread on page load
      const { Canvas, Textbox } = await import('fabric')

      const res = await quoteTemplateApi.get(q.branch_id)
      const templateJson = res.data?.canvas_json
      
      if (!templateJson) {
        toast.dismiss(loadingId)
        toast.error('ไม่พบแบบฟอร์มใบเสนอราคาสำหรับสาขานี้ กรุณาไปออกแบบที่เมนู "แบบใบเสนอราคา"')
        return
      }

      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.top = '0'
      document.body.appendChild(container)

      const canvasEl = document.createElement('canvas')
      canvasEl.width = 794
      canvasEl.height = 1123
      container.appendChild(canvasEl)

      const fCanvas = new Canvas(canvasEl, { backgroundColor: '#ffffff' })
      
      // Fabric v6 loadFromJSON is async
      await fCanvas.loadFromJSON(templateJson)

      // Wait for fonts to be ready
      await new Promise(r => setTimeout(r, 500))
      // Inject data into Fabric.js text objects
      const objs = fCanvas.getObjects()
      objs.forEach((obj: any) => {
        const lockedType = obj._lockedType
        if (obj instanceof Textbox) {
          if (lockedType === 'quote_number') obj.set('text', `เลขที่: ${q.quotation_no}`)
          if (lockedType === 'date') obj.set('text', `วันที่/Date: ${fmtDate(q.created_at)}`)
          if (lockedType === 'customer_info') obj.set('text', `ผู้ซื้อ/Customer: ${q.customer_name}\nที่อยู่/Address: ${q.customer_address}\nเลขผู้เสียภาษี: ${q.customer_tax_id}`)
          if (lockedType === 'subtotal_text') {
            obj.set('text', `ตัวอักษร/In Letter: ${ThaiBahtText(q.total_amount)}                                                   รวมสุทธิ Grand Total    ฿ ${fmtNum(q.total_amount)}`)
          }
        }
      })
      
      // Draw items inside table body bounds
      const tableBodyObj = objs.find((o: any) => o._lockedType === 'table_body')
      if (tableBodyObj) {
        let startY = (tableBodyObj.top || 300) + 15
        q.items.forEach((it, idx) => {
          fCanvas.add(new Textbox(`${idx + 1}`, { left: 55, top: startY, width: 30, fontSize: 11, fontFamily: 'Sarabun, Inter, sans-serif', textAlign: 'center', fill: '#1a1a2e' }))
          fCanvas.add(new Textbox(it.description, { left: 95, top: startY, width: 330, fontSize: 11, fontFamily: 'Sarabun, Inter, sans-serif', fill: '#1a1a2e' }))
          fCanvas.add(new Textbox(`${it.quantity}`, { left: 435, top: startY, width: 80, fontSize: 11, fontFamily: 'Sarabun, Inter, sans-serif', textAlign: 'center', fill: '#1a1a2e' }))
          fCanvas.add(new Textbox(fmtNum(it.price_per_unit), { left: 525, top: startY, width: 90, fontSize: 11, fontFamily: 'Sarabun, Inter, sans-serif', textAlign: 'right', fill: '#1a1a2e' }))
          fCanvas.add(new Textbox(fmtNum(it.quantity * it.price_per_unit), { left: 625, top: startY, width: 100, fontSize: 11, fontFamily: 'Sarabun, Inter, sans-serif', textAlign: 'right', fill: '#1a1a2e' }))
          startY += 20
        })
      }
      
      fCanvas.renderAll()
      
      // Wait for final render flush
      await new Promise(r => setTimeout(r, 200))

      // Export logic
      const dataUrl = fCanvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 })
      const pdf = new jsPDF('p', 'mm', 'a4')
      pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 297)
      
      const pdfOutput = pdf.output('arraybuffer')
      const blob = new Blob([pdfOutput], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${q.quotation_no}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      
      toast.dismiss(loadingId)
      toast.success('ดาวน์โหลด PDF สำเร็จ')
      fCanvas.dispose()
      document.body.removeChild(container)
    } catch (error) { 
      toast.dismiss(loadingId)
      toast.error('สร้าง PDF ไม่สำเร็จ') 
    }
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
  const fmtNum = (n: number) => n?.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'

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
                  <button className="btn btn-sm btn-danger" onClick={() => del(q)}><Trash2 size={14} /></button>
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
              <select className="form-input" value={form.branch_id} onChange={e => handleBranchSelect(e.target.value)}>
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
          <div className="form-group"><label className="form-label">ผู้จัดทำใบเสนอราคา</label><input className="form-input" value={form.prepared_by} onChange={e => setForm({ ...form, prepared_by: e.target.value })} /></div>

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
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>ระบบจะสร้างงาน 1 งานต่อ 1 รายการในใบเสนอราคา<br />ทุกงานจะเชื่อมกลับมาที่ใบเสนอราคานี้</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn" onClick={() => setShowCreateJobModal(null)}>ไม่ใช่</button>
              <button className="btn btn-primary" onClick={() => createJobFromQuotation(showCreateJobModal)}>ใช่ — สร้างงาน</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
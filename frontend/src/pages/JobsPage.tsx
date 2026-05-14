import { useState, useEffect, useRef } from 'react'
import { jobApi, jobStatusApi } from '../api/client'
import type { Job, JobStatus } from '../types'
import { KanbanSquare, Plus, Pencil, Trash2, GripVertical, Printer, StickyNote, X, FileText, MessageSquare, User, Palette } from 'lucide-react'
import toast from 'react-hot-toast'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors,
  useDroppable, type DragEndEvent, type DragStartEvent
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Helper to calculate contrasting text color
const getContrastYIQ = (hexcolor: string) => {
  hexcolor = hexcolor.replace("#", "");
  var r = parseInt(hexcolor.substr(0, 2), 16);
  var g = parseInt(hexcolor.substr(2, 2), 16);
  var b = parseInt(hexcolor.substr(4, 2), 16);
  var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'black' : 'white';
}

function DroppableColumn({ col, children }: { col: JobStatus; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.name })
  const textColor = getContrastYIQ(col.color)
  return (
    <div ref={setNodeRef} className="kanban-column" style={{
      background: isOver ? '#f1f5f9' : '#f8fafc',
      borderRadius: 16, padding: '16px 12px', minHeight: 400,
      border: isOver ? '2px dashed #cbd5e1' : `1px solid #e2e8f0`,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      transition: 'all 0.2s ease', flex: 1, minWidth: 280
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: col.color, boxShadow: '0 0 0 2px white, 0 0 0 3px ' + col.color }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#334155' }}>{col.name}</span>
        </div>
      </div>
      {children}
    </div>
  )
}

function JobCard({ job, statuses, onEdit, onDelete, onViewNote, onPrintReceipt, isDragging }: {
  job: Job; statuses: JobStatus[]; onEdit?: () => void; onDelete?: () => void; onViewNote?: () => void; onPrintReceipt?: () => void; isDragging?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } = useSortable({ id: job.id })
  const style = {
    transform: CSS.Transform.toString(transform), transition,
    opacity: isSortDragging ? 0.4 : 1,
  }
  const fmtPrice = (n: number) => n > 0 ? `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 0 })}` : ''
  const statusInfo = statuses.find(s => s.name === job.status) || { color: '#e2e8f0', name: job.status }
  const textColor = getContrastYIQ(statusInfo.color)
  
  return (
    <div ref={setNodeRef} style={{
      ...style,
      background: '#ffffff', borderRadius: 12, padding: '16px',
      border: `1px solid ${statusInfo.color}40`,
      marginBottom: 12, cursor: 'default',
      boxShadow: isDragging ? '0 10px 25px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.04)',
    }} {...attributes}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <span {...listeners} style={{ cursor: 'grab', color: '#94a3b8', flexShrink: 0, marginTop: 2 }}><GripVertical size={16} /></span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', lineHeight: 1.3 }}>{job.title}</div>
              {job.description && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={12}/> {job.description}</div>}
            </div>
          </div>
          {/* Show quotation reference */}
          {job.quotation_id && (
            <div style={{ fontSize: 10, color: '#6366f1', marginTop: 4, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
              <FileText size={10} /> จาก QT #{job.quotation_id}
            </div>
          )}
          {/* Show assignee */}
          {job.assignee_text && (
            <div style={{ fontSize: 11, color: '#475569', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
              <User size={12} /> {job.assignee_text}
            </div>
          )}
          {/* Show note preview if exists */}
          {job.note && (
            <div style={{ fontSize: 11, color: '#92400e', background: '#fef3c7', padding: '4px 8px', borderRadius: 6, marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <StickyNote size={11} /> {job.note.length > 30 ? job.note.slice(0, 30) + '...' : job.note}
            </div>
          )}
        </div>
        {!isDragging && (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0, flexWrap: 'wrap', flexDirection: 'column' }}>
            {job.status === 'เสร็จแล้ว' && <button className="btn-icon" onClick={onPrintReceipt} style={{ width: 28, height: 28, color: '#059669', background: '#ecfdf5' }} title="พิมพ์ใบเสร็จ"><Printer size={14} /></button>}
            {job.note && <button className="btn-icon" onClick={onViewNote} style={{ width: 28, height: 28, background: '#f8fafc' }} title="ดูบันทึก"><StickyNote size={14} /></button>}
            <button className="btn-icon" onClick={onEdit} style={{ width: 28, height: 28, background: '#f8fafc' }}><Pencil size={14} /></button>
            <button className="btn-icon delete" onClick={onDelete} style={{ width: 28, height: 28, background: '#fef2f2', color: '#ef4444' }}><Trash2 size={14} /></button>
          </div>
        )}
      </div>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
        <span style={{
          fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 600,
          background: statusInfo.color, color: textColor,
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}>{statusInfo.name}</span>
        {job.price > 0 && <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{fmtPrice(job.price)}</span>}
      </div>
    </div>
  )
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [statuses, setStatuses] = useState<JobStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [editJob, setEditJob] = useState<Job | null>(null)
  const [form, setForm] = useState({ title: '', description: '', payment_status: 'unpaid', status: '', price: '', note: '', assignee_text: '' })
  const [statusForm, setStatusForm] = useState({ name: '', color: '#3b82f6' })
  const [activeId, setActiveId] = useState<number | null>(null)
  const [showNoteModal, setShowNoteModal] = useState<Job | null>(null)
  const [printReceiptJob, setPrintReceiptJob] = useState<Job | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const fetchJobsAndStatuses = async () => {
    try { 
      const [rJobs, rStatuses] = await Promise.all([jobApi.getAll(), jobStatusApi.getAll()])
      setJobs(rJobs.data || [])
      setStatuses(rStatuses.data || [])
    }
    catch { toast.error('โหลดข้อมูลไม่สำเร็จ') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchJobsAndStatuses() }, [])

  const openAdd = (colName?: string) => {
    setEditJob(null)
    const defaultStatus = colName || (statuses.length > 0 ? statuses[0].name : 'Pool งาน')
    setForm({ title: '', description: '', payment_status: 'unpaid', status: defaultStatus, price: '', note: '', assignee_text: '' })
    setShowModal(true)
  }
  const openEdit = (j: Job) => {
    setEditJob(j)
    setForm({ title: j.title, description: j.description, payment_status: j.payment_status, status: j.status, price: j.price > 0 ? String(j.price) : '', note: j.note || '', assignee_text: j.assignee_text || '' })
    setShowModal(true)
  }

  const save = async () => {
    if (!form.title.trim()) { toast.error('กรอกชื่องาน'); return }
    if (!form.assignee_text.trim()) { toast.error('กรุณาระบุผู้รับผิดชอบ'); return }
    const payload = { ...form, price: parseFloat(form.price) || 0 }
    try {
      if (editJob) { await jobApi.update(editJob.id, payload); toast.success('แก้ไขสำเร็จ') }
      else { await jobApi.create(payload); toast.success('เพิ่มงานสำเร็จ') }
      setShowModal(false); fetchJobsAndStatuses()
    } catch { toast.error('บันทึกไม่สำเร็จ') }
  }

  const saveStatus = async () => {
    if (!statusForm.name.trim()) { toast.error('กรอกชื่อสถานะ'); return }
    try {
      await jobStatusApi.create({ ...statusForm, order_idx: statuses.length + 1 })
      toast.success('เพิ่มสถานะสำเร็จ')
      setShowStatusModal(false)
      fetchJobsAndStatuses()
    } catch { toast.error('เพิ่มไม่สำเร็จ') }
  }

  const del = async (job: Job) => {
    const msg = job.quotation_id
      ? `งานนี้เชื่อมกับใบเสนอราคา\nหากลบจะตัดการเชื่อมออก แต่ใบเสนอราคายังอยู่\nยืนยันลบงาน "${job.title}"?`
      : `ยืนยันลบงาน "${job.title}"?`

    if (!confirm(msg)) return
    try { 
      await jobApi.delete(job.id); 
      toast.success('ลบสำเร็จ'); 
      fetchJobsAndStatuses() 
    } catch (err: any) { 
      toast.error(err.response?.data?.error || 'ลบไม่สำเร็จ') 
    }
  }

  const handleDragStart = (event: DragStartEvent) => { setActiveId(event.active.id as number) }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const jobId = active.id as number
    const overStr = String(over.id)
    
    // Validate assignee if moving columns
    const job = jobs.find(j => j.id === jobId)
    if (!job) return

    const targetStatus = statuses.find(s => s.name === overStr)
    if (targetStatus && job.status !== targetStatus.name) {
      if (!job.assignee_text) {
        toast.error('กรุณาระบุผู้รับผิดชอบก่อนเปลี่ยนสถานะงาน')
        return
      }
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: targetStatus.name } : j))
      try {
        await jobApi.update(jobId, { ...job, status: targetStatus.name })
      } catch { toast.error('อัปเดตไม่สำเร็จ'); fetchJobsAndStatuses() }
    }
  }

  const activeJob = activeId ? jobs.find(j => j.id === activeId) : null

  // Receipt printing
  const printReceipt = async (job: Job) => {
    setPrintReceiptJob(job)
    await new Promise(r => setTimeout(r, 500))
    const el = receiptRef.current
    if (!el) { toast.error('ไม่สามารถสร้างใบเสร็จได้'); return }
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pw = pdf.internal.pageSize.getWidth()
      const ph = (canvas.height * pw) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pw, ph)
      const pdfOutput = pdf.output('arraybuffer')
      const blob = new Blob([pdfOutput], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt-job-${job.id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.success('ดาวน์โหลดใบเสร็จสำเร็จ')
    } catch { toast.error('สร้างใบเสร็จไม่สำเร็จ') }
    setPrintReceiptJob(null)
  }

  // Get related jobs from same quotation
  const getRelatedJobs = (job: Job): Job[] => {
    if (!job.quotation_id) return [job]
    return jobs.filter(j => j.quotation_id === job.quotation_id)
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
  const fmtNum = (n: number) => n?.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'

  const receiptJobs = printReceiptJob ? getRelatedJobs(printReceiptJob) : []
  const receiptTotal = receiptJobs.reduce((s, j) => s + (j.price || 0), 0)

  // Modern gradient background for page
  return (
    <div style={{ background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', minHeight: 'calc(100vh - 60px)', paddingBottom: 40, margin: '-20px', padding: '20px' }}>
      <div className="page-header" style={{ background: 'white', padding: '20px 24px', borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: 24 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 24, color: '#1e293b' }}>
            <KanbanSquare size={28} color="#6366f1" /> การดำเนินงาน
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Kanban Board — ลากการ์ดเพื่อเปลี่ยนสถานะ, เพิ่มสถานะใหม่ได้เอง</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => setShowStatusModal(true)} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
            <Plus size={16} /> คอลัมน์สถานะ
          </button>
          <button className="btn btn-primary" onClick={() => openAdd()} style={{ background: '#6366f1', border: 'none', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
            <Plus size={16} /> เพิ่มงาน
          </button>
        </div>
      </div>

      {loading ? <div className="card"><p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>กำลังโหลด...</p></div> : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="kanban-board" style={{ display: 'flex', gap: 20, minWidth: 'min-content', overflowX: 'auto', paddingBottom: 20, scrollSnapType: 'x mandatory' }}>
            {statuses.map((col) => {
              const colJobs = jobs.filter(j => j.status === col.name)
              return (
                <div key={col.id} style={{ scrollSnapAlign: 'start' }}>
                  <DroppableColumn col={col}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontSize: 12, color: '#64748b', background: '#f1f5f9', padding: '4px 12px', borderRadius: 20, fontWeight: 700 }}>{colJobs.length} งาน</span>
                      <button onClick={() => openAdd(col.name)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', cursor: 'pointer', color: '#64748b', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}><Plus size={16} /></button>
                    </div>
                    <SortableContext items={colJobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
                      <div style={{ minHeight: 40 }}>
                        {colJobs.map(j => <JobCard key={j.id} job={j} statuses={statuses} onEdit={() => openEdit(j)} onDelete={() => del(j)} onViewNote={() => setShowNoteModal(j)} onPrintReceipt={() => printReceipt(j)} />)}
                      </div>
                    </SortableContext>
                  </DroppableColumn>
                </div>
              )
            })}
          </div>
          <DragOverlay>
            {activeJob ? <JobCard job={activeJob} statuses={statuses} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Job Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
          <h3 style={{ marginBottom: 20 }}>{editJob ? 'แก้ไขงาน' : 'เพิ่มงานใหม่'}</h3>
          <div className="form-group"><label className="form-label">ชื่องาน *</label><input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="เช่น ป้ายร้าน ABC" autoFocus /></div>
          <div className="form-group"><label className="form-label">รายละเอียด</label><textarea className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} style={{ resize: 'vertical', fontFamily: 'inherit' }} /></div>
          <div className="form-group"><label className="form-label">ราคางาน (บาท)</label><input className="form-input qty-input" type="number" inputMode="decimal" min="0" step="any" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0" /></div>
          <div className="form-group"><label className="form-label">ผู้รับผิดชอบ * (บังคับ)</label><input className="form-input" value={form.assignee_text} onChange={e => setForm({ ...form, assignee_text: e.target.value })} placeholder="เช่น ช่างเอก, แอดมิน" /></div>
          <div className="form-group"><label className="form-label">สถานะงาน</label>
            <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {statuses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><StickyNote size={14} /> บันทึกช่วยจำ / Note</label>
            <textarea className="form-input" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={3} style={{ resize: 'vertical', fontFamily: 'inherit' }} placeholder="จดบันทึกเพิ่มเติม..." />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}><button className="btn" onClick={() => setShowModal(false)} style={{ minHeight: 44 }}>ยกเลิก</button><button className="btn btn-primary" onClick={save} style={{ minHeight: 44 }}>{editJob ? 'บันทึก' : 'เพิ่ม'}</button></div>
        </div></div>
      )}

      {/* Add Status Column Modal */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
          <h3 style={{ marginBottom: 20 }}>เพิ่มคอลัมน์สถานะใหม่</h3>
          <div className="form-group"><label className="form-label">ชื่อสถานะ</label><input className="form-input" value={statusForm.name} onChange={e => setStatusForm({ ...statusForm, name: e.target.value })} placeholder="เช่น รอออกแบบ, กำลังพิมพ์" autoFocus /></div>
          <div className="form-group"><label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Palette size={14} /> สีประจำสถานะ</label>
            <input type="color" className="form-input" value={statusForm.color} onChange={e => setStatusForm({ ...statusForm, color: e.target.value })} style={{ height: 44, padding: 4 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}><button className="btn" onClick={() => setShowStatusModal(false)} style={{ minHeight: 44 }}>ยกเลิก</button><button className="btn btn-primary" onClick={saveStatus} style={{ minHeight: 44 }}>เพิ่มสถานะ</button></div>
        </div></div>
      )}

      {/* View Note Modal */}
      {showNoteModal && (
        <div className="modal-overlay" onClick={() => setShowNoteModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><StickyNote size={18} /> บันทึกช่วยจำ</h3>
              <button className="btn btn-sm" onClick={() => setShowNoteModal(null)}><X size={14} /></button>
            </div>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>{showNoteModal.title}</div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {showNoteModal.note || 'ไม่มีบันทึก'}
            </div>
          </div>
        </div>
      )}

      {/* Hidden Receipt Area for PDF */}
      {printReceiptJob && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
          <div ref={receiptRef} style={{
            fontFamily: "'Sarabun', sans-serif",
            width: 794, padding: '40px 50px', background: 'white', color: 'black', fontSize: 14, lineHeight: 1.6,
          }}>
            {/* Receipt Header */}
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>ใบเสร็จรับเงิน / RECEIPT</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>วันที่: {new Date().toLocaleDateString('th-TH', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
            <hr style={{ border: 'none', borderTop: '2px solid #222', margin: '10px 0 20px 0' }} />

            {/* Quotation Reference */}
            {printReceiptJob.quotation_id && (
              <div style={{ fontSize: 13, marginBottom: 12, color: '#444' }}>
                <b>อ้างอิงใบเสนอราคา / Quotation Ref:</b> QT #{printReceiptJob.quotation_id}
              </div>
            )}

            {/* Jobs Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ border: '1px solid #999', padding: '8px 6px', width: 40, textAlign: 'center' }}>ที่</th>
                  <th style={{ border: '1px solid #999', padding: '8px 6px', textAlign: 'left' }}>รายการ / Description</th>
                  <th style={{ border: '1px solid #999', padding: '8px 6px', width: 100, textAlign: 'center' }}>สถานะ</th>
                  <th style={{ border: '1px solid #999', padding: '8px 6px', width: 110, textAlign: 'right' }}>ราคา / Amount</th>
                </tr>
              </thead>
              <tbody>
                {receiptJobs.map((rj, idx) => (
                  <tr key={rj.id} style={{ background: getStatusBg(rj.status, rj.status_text) }}>
                    <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #999', padding: '6px 8px' }}>
                      <div style={{ fontWeight: 600 }}>{rj.title}</div>
                      {rj.description && <div style={{ fontSize: 11, color: '#666' }}>{rj.description}</div>}
                    </td>
                    <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: getStatusColor(rj.status, rj.status_text), color: 'white'
                      }}>{rj.status === 'done' ? 'เสร็จแล้ว' : (rj.status_text || 'Pool งาน')}</span>
                    </td>
                    <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{fmtNum(rj.price || 0)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8f8f8' }}>
                  <td colSpan={3} style={{ border: '1px solid #999', padding: '10px 8px', textAlign: 'right', fontWeight: 700, fontSize: 15 }}>
                    รวมสุทธิ / Grand Total
                  </td>
                  <td style={{ border: '1px solid #999', padding: '10px 8px', textAlign: 'right', fontWeight: 700, fontSize: 16 }}>
                    {fmtNum(receiptTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Signature */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 60, paddingLeft: 40, paddingRight: 40 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>ผู้รับเงิน</div>
                <div style={{ marginTop: 40, fontSize: 13 }}>(................................)</div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>วันที่ ................................</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>ผู้จ่ายเงิน</div>
                <div style={{ marginTop: 40, fontSize: 13 }}>(................................)</div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>วันที่ ................................</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

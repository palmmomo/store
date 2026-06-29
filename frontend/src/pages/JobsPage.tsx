import { useState, useEffect, useRef } from 'react'
import { jobApi, jobStatusApi } from '../api/client'
import type { Job, JobStatus } from '../types'
import { KanbanSquare, Plus, Pencil, Trash2, GripVertical, Printer, StickyNote, X, FileText, User, Palette, MoreHorizontal, ImagePlus } from 'lucide-react'
import { compressImage } from '../utils/compressImage'
import toast from 'react-hot-toast'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
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

function SortableColumn({ col, onEdit, onDelete, children }: { 
  col: JobStatus; onEdit: () => void; onDelete: () => void; children: React.ReactNode 
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ 
    id: `col-${col.id}`,
    data: { type: 'Column', col }
  })
  const [showMenu, setShowMenu] = useState(false)
  const menuItemStyle = { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left' as const, fontSize: 13, cursor: 'pointer', color: '#334155' }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    background: isDragging ? '#f1f5f9' : '#f8fafc',
    borderRadius: 16, padding: '16px 12px', minHeight: 400,
    border: isDragging ? '2px dashed #cbd5e1' : `1px solid #e2e8f0`,
    boxShadow: isDragging ? '0 10px 25px rgba(0,0,0,0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column' as const
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '0 4px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span {...attributes} {...listeners} style={{ cursor: 'grab', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
            <GripVertical size={18} />
          </span>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: col.color, boxShadow: '0 0 0 2px white, 0 0 0 3px ' + col.color }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#334155' }}>{col.name}</span>
        </div>
        <button onClick={() => setShowMenu(!showMenu)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
          <MoreHorizontal size={18} />
        </button>
        {showMenu && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowMenu(false)} />
            <div style={{ position: 'absolute', top: 28, right: 0, background: 'white', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: 4, zIndex: 20, minWidth: 150, border: '1px solid #e2e8f0' }}>
              <button onClick={() => { onEdit(); setShowMenu(false) }} style={menuItemStyle}><Pencil size={14}/> แก้ไขสถานะ</button>
              <button onClick={() => { onDelete(); setShowMenu(false) }} style={{ ...menuItemStyle, color: '#ef4444' }}><Trash2 size={14}/> ลบสถานะ</button>
            </div>
          </>
        )}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

function JobCard({ job, statuses, onEdit, onDelete, onViewNote, onPrintReceipt, onViewCover, isDragging }: {
  job: Job; statuses: JobStatus[]; onEdit?: () => void; onDelete?: () => void; onViewNote?: () => void; onPrintReceipt?: () => void; onViewCover?: () => void; isDragging?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } = useSortable({ 
    id: `job-${job.id}`,
    data: { type: 'Job', job }
  })
  const [showMenu, setShowMenu] = useState(false)
  const menuItemStyle = { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left' as const, fontSize: 13, cursor: 'pointer', color: '#334155' }

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
      background: '#ffffff', borderRadius: 12, overflow: 'hidden',
      border: `1px solid ${statusInfo.color}40`,
      marginBottom: 12, cursor: 'default',
      boxShadow: isDragging ? '0 10px 25px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.04)',
    }}>
      {job.cover_image_url && (
        <div
          onClick={() => onViewCover?.()}
          style={{
            width: '100%', height: 100, overflow: 'hidden', cursor: 'pointer',
            borderBottom: `1px solid ${statusInfo.color}20`,
          }}
        >
          <img
            src={job.cover_image_url}
            alt="cover"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="lazy"
          />
        </div>
      )}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <span {...attributes} {...listeners} style={{ cursor: 'grab', color: '#94a3b8', flexShrink: 0, marginTop: 2 }}><GripVertical size={16} /></span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', lineHeight: 1.3 }}>{job.title}</div>
              {job.description && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={12}/> {job.description}</div>}
            </div>
          </div>
          {job.quotation_id && (
            <div style={{ fontSize: 10, color: '#6366f1', marginTop: 4, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
              <FileText size={10} /> จาก QT #{job.quotation_id}
            </div>
          )}
          {job.assignee_text && (
            <div style={{ fontSize: 11, color: '#475569', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
              <User size={12} /> ดำเนินการโดย: {job.assignee_text}
            </div>
          )}
          {job.note && (
            <div style={{ fontSize: 11, color: '#92400e', background: '#fef3c7', padding: '4px 8px', borderRadius: 6, marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <StickyNote size={11} /> {job.note.length > 30 ? job.note.slice(0, 30) + '...' : job.note}
            </div>
          )}
        </div>
        {!isDragging && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowMenu(!showMenu)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowMenu(false)} />
                <div style={{ position: 'absolute', top: 24, right: 0, background: 'white', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: 4, zIndex: 20, minWidth: 140, border: '1px solid #e2e8f0' }}>
                  {job.status === 'เสร็จแล้ว' && <button onClick={() => { onPrintReceipt?.(); setShowMenu(false) }} style={menuItemStyle}><Printer size={14}/> พิมพ์ใบเสร็จ</button>}
                  {job.note && <button onClick={() => { onViewNote?.(); setShowMenu(false) }} style={menuItemStyle}><StickyNote size={14}/> ดูบันทึก</button>}
                  <button onClick={() => { onEdit?.(); setShowMenu(false) }} style={menuItemStyle}><Pencil size={14}/> แก้ไขงาน</button>
                  <button onClick={() => { onDelete?.(); setShowMenu(false) }} style={{ ...menuItemStyle, color: '#ef4444' }}><Trash2 size={14}/> ลบงาน</button>
                </div>
              </>
            )}
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
      </div>{/* end padding div */}
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
  const [editStatus, setEditStatus] = useState<JobStatus | null>(null)

  const [form, setForm] = useState({ title: '', description: '', payment_status: 'unpaid', status: '', price: '', note: '', assignee_text: '' })
  const [statusForm, setStatusForm] = useState({ name: '', color: '#3b82f6' })
  const [activeItem, setActiveItem] = useState<{ type: 'Column' | 'Job', col?: JobStatus, job?: Job } | null>(null)
  
  const [pendingMove, setPendingMove] = useState<{ jobId: number, targetStatus: string, currentAssignee: string } | null>(null)
  const [moveAssignee, setMoveAssignee] = useState('')

  const [showNoteModal, setShowNoteModal] = useState<Job | null>(null)
  const [printReceiptJob, setPrintReceiptJob] = useState<Job | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  // Cover image state
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverLightbox, setCoverLightbox] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const fetchJobsAndStatuses = async () => {
    try { 
      const [rJobs, rStatuses] = await Promise.all([jobApi.getAll(), jobStatusApi.getAll()])
      setJobs(rJobs.data || [])
      const sortedStatuses = (rStatuses.data || []).sort((a: JobStatus, b: JobStatus) => a.order_idx - b.order_idx)
      setStatuses(sortedStatuses)
    }
    catch { toast.error('โหลดข้อมูลไม่สำเร็จ') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchJobsAndStatuses() }, [])

  const openAdd = (colName?: string) => {
    setEditJob(null)
    const defaultStatus = colName || (statuses.length > 0 ? statuses[0].name : 'Pool งาน')
    setForm({ title: '', description: '', payment_status: 'unpaid', status: defaultStatus, price: '', note: '', assignee_text: '' })
    setCoverFile(null); setCoverPreview(null)
    setShowModal(true)
  }
  
  const openEdit = (j: Job) => {
    setEditJob(j)
    setForm({ title: j.title, description: j.description, payment_status: j.payment_status, status: j.status, price: j.price > 0 ? String(j.price) : '', note: j.note || '', assignee_text: j.assignee_text || '' })
    setCoverFile(null); setCoverPreview(j.cover_image_url || null)
    setShowModal(true)
  }

  const save = async () => {
    if (!form.title.trim()) { toast.error('กรอกชื่องาน'); return }
    if (!form.assignee_text.trim()) { toast.error('กรุณาระบุผู้รับผิดชอบ'); return }
    const payload = { ...form, price: parseFloat(form.price) || 0 }
    try {
      let jobId: number | undefined
      if (editJob) { 
        await jobApi.update(editJob.id, payload); 
        jobId = editJob.id
        toast.success('แก้ไขสำเร็จ') 
      } else { 
        const res = await jobApi.create(payload)
        const created = Array.isArray(res.data) ? res.data[0] : res.data
        jobId = created?.id
        toast.success('เพิ่มงานสำเร็จ') 
      }
      // Upload cover if file selected
      if (coverFile && jobId) {
        try {
          await jobApi.uploadCover(jobId, coverFile)
        } catch { toast.error('อัปโหลดรูป cover ไม่สำเร็จ') }
      }
      setShowModal(false); fetchJobsAndStatuses()
    } catch { toast.error('บันทึกไม่สำเร็จ') }
  }

  const del = async (job: Job) => {
    const msg = job.quotation_id
      ? `งานนี้เชื่อมกับใบเสนอราคา\nหากลบจะตัดการเชื่อมออก แต่ใบเสนอราคายังอยู่\nยืนยันลบงาน "${job.title}"?`
      : `ยืนยันลบงาน "${job.title}"?`
    if (!confirm(msg)) return
    try { await jobApi.delete(job.id); toast.success('ลบสำเร็จ'); fetchJobsAndStatuses() } 
    catch (err: any) { toast.error(err.response?.data?.error || 'ลบไม่สำเร็จ') }
  }

  const openAddStatus = () => {
    setEditStatus(null)
    setStatusForm({ name: '', color: '#3b82f6' })
    setShowStatusModal(true)
  }

  const openEditStatus = (col: JobStatus) => {
    setEditStatus(col)
    setStatusForm({ name: col.name, color: col.color })
    setShowStatusModal(true)
  }

  const saveStatus = async () => {
    if (!statusForm.name.trim()) { toast.error('กรอกชื่อสถานะ'); return }
    try {
      if (editStatus) {
        await jobStatusApi.update(editStatus.id, { name: statusForm.name, color: statusForm.color, order_idx: editStatus.order_idx })
        toast.success('แก้ไขสถานะสำเร็จ')
      } else {
        await jobStatusApi.create({ ...statusForm, order_idx: statuses.length + 1 })
        toast.success('เพิ่มสถานะสำเร็จ')
      }
      setShowStatusModal(false)
      fetchJobsAndStatuses()
    } catch { toast.error('บันทึกไม่สำเร็จ') }
  }

  const deleteStatus = async (col: JobStatus) => {
    const hasJobs = jobs.some(j => j.status === col.name)
    if (hasJobs) {
      toast.error('ไม่สามารถลบได้ เนื่องจากยังมีงานค้างอยู่ในสถานะนี้')
      return
    }
    if (!confirm(`ยืนยันลบสถานะ "${col.name}" ทิ้งใช่หรือไม่?`)) return
    try {
      await jobStatusApi.delete(col.id)
      toast.success('ลบสถานะสำเร็จ')
      fetchJobsAndStatuses()
    } catch { toast.error('ลบสถานะไม่สำเร็จ') }
  }

  // Drag and Drop Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveItem(active.data.current as { type: 'Column' | 'Job', col?: JobStatus, job?: Job })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveItem(null)
    const { active, over } = event
    if (!over) return

    const activeType = active.data.current?.type
    const overType = over.data.current?.type

    // 1. Dragging a Column
    if (activeType === 'Column') {
      const activeColId = parseInt(String(active.id).replace('col-', ''))
      const overColId = parseInt(String(over.id).replace('col-', ''))
      
      if (activeColId !== overColId) {
        const oldIndex = statuses.findIndex(s => s.id === activeColId)
        const newIndex = statuses.findIndex(s => s.id === overColId)
        
        const newStatuses = arrayMove(statuses, oldIndex, newIndex)
        setStatuses(newStatuses)
        
        try {
          await Promise.all(newStatuses.map((s, idx) => 
            jobStatusApi.update(s.id, { name: s.name, color: s.color, order_idx: idx + 1 })
          ))
        } catch {
          toast.error('เลื่อนสถานะไม่สำเร็จ')
          fetchJobsAndStatuses()
        }
      }
      return
    }

    // 2. Dragging a Job Card
    if (activeType === 'Job') {
      const jobId = parseInt(String(active.id).replace('job-', ''))
      const job = jobs.find(j => j.id === jobId)
      if (!job) return

      let targetStatusName = ''
      if (overType === 'Column') {
        targetStatusName = over.data.current?.col.name
      } else if (overType === 'Job') {
        targetStatusName = over.data.current?.job.status
      }

      if (targetStatusName && job.status !== targetStatusName) {
        setPendingMove({ 
          jobId: job.id, 
          targetStatus: targetStatusName, 
          currentAssignee: job.assignee_text || '' 
        })
        setMoveAssignee(job.assignee_text || '') 
      }
    }
  }

  const confirmMoveJob = async () => {
    if (!pendingMove) return
    if (!moveAssignee.trim()) { toast.error('กรุณาระบุชื่อผู้ดำเนินการ'); return }

    const job = jobs.find(j => j.id === pendingMove.jobId)
    if (!job) { setPendingMove(null); return }

    setJobs(prev => prev.map(j => j.id === pendingMove.jobId ? { ...j, status: pendingMove.targetStatus, assignee_text: moveAssignee } : j))
    
    try {
      await jobApi.update(pendingMove.jobId, { 
        title: job.title,
        description: job.description,
        status: pendingMove.targetStatus,
        payment_status: job.payment_status,
        price: job.price,
        assignee_text: moveAssignee, 
        note: job.note,
        assigned_to: job.assigned_to || undefined
      })
      toast.success('ย้ายสถานะและอัปเดตผู้ดำเนินการสำเร็จ')
    } catch { 
      toast.error('อัปเดตสถานะไม่สำเร็จ')
      fetchJobsAndStatuses() 
    }
    
    setPendingMove(null)
    setMoveAssignee('')
  }

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

  const getRelatedJobs = (job: Job): Job[] => {
    if (!job.quotation_id) return [job]
    return jobs.filter(j => j.quotation_id === job.quotation_id)
  }

  const fmtNum = (n: number) => n?.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'
  const receiptJobs = printReceiptJob ? getRelatedJobs(printReceiptJob) : []
  const receiptTotal = receiptJobs.reduce((s, j) => s + (j.price || 0), 0)

  return (
    <div style={{ background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', minHeight: 'calc(100vh - 60px)', paddingBottom: 40, margin: '-20px', padding: '20px' }}>
      <div className="page-header" style={{ background: 'white', padding: '20px 24px', borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: 24 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 24, color: '#1e293b' }}>
            <KanbanSquare size={28} color="#6366f1" /> การดำเนินงาน
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Kanban Board — ลากที่จุดไข่ปลาเพื่อย้ายงานหรือสลับสถานะ</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn" onClick={openAddStatus} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
            <Plus size={16} /> คอลัมน์สถานะ
          </button>
          <button className="btn btn-primary" onClick={() => openAdd()} style={{ background: '#6366f1', border: 'none', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
            <Plus size={16} /> เพิ่มงาน
          </button>
        </div>
      </div>

      {loading ? <div className="card"><p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>กำลังโหลด...</p></div> : (
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCorners} 
          onDragStart={handleDragStart} 
          onDragEnd={handleDragEnd}
        >
          <div className="kanban-board" style={{ display: 'flex', gap: 20, minWidth: 'min-content', overflowX: 'auto', paddingBottom: 20, scrollSnapType: 'x mandatory' }}>
            <SortableContext items={statuses.map(s => `col-${s.id}`)} strategy={horizontalListSortingStrategy}>
              {statuses.map((col) => {
                const colJobs = jobs.filter(j => j.status === col.name)
                return (
                  <div key={col.id} style={{ scrollSnapAlign: 'start' }}>
                    <SortableColumn 
                      col={col} 
                      onEdit={() => openEditStatus(col)}
                      onDelete={() => deleteStatus(col)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ fontSize: 12, color: '#64748b', background: '#f1f5f9', padding: '4px 12px', borderRadius: 20, fontWeight: 700 }}>{colJobs.length} งาน</span>
                        <button onClick={() => openAdd(col.name)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', cursor: 'pointer', color: '#64748b', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}><Plus size={16} /></button>
                      </div>
                      <SortableContext items={colJobs.map(j => `job-${j.id}`)} strategy={verticalListSortingStrategy}>
                        <div style={{ minHeight: 40 }}>
                          {colJobs.map(j => <JobCard key={j.id} job={j} statuses={statuses} onEdit={() => openEdit(j)} onDelete={() => del(j)} onViewNote={() => setShowNoteModal(j)} onPrintReceipt={() => printReceipt(j)} onViewCover={() => j.cover_image_url && setCoverLightbox(j.cover_image_url)} />)}
                        </div>
                      </SortableContext>
                    </SortableColumn>
                  </div>
                )
              })}
            </SortableContext>
          </div>
          
          <DragOverlay>
            {activeItem?.type === 'Column' && activeItem.col ? (
              <SortableColumn col={activeItem.col} onEdit={()=>{}} onDelete={()=>{}}>
                <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>กำลังลาก...</div>
              </SortableColumn>
            ) : activeItem?.type === 'Job' && activeItem.job ? (
              <JobCard job={activeItem.job} statuses={statuses} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {pendingMove && (
        <div className="modal-overlay" onClick={() => setPendingMove(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f0f9ff', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>ระบุผู้ดำเนินการ</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, marginTop: 4 }}>
                  กำลังย้ายไปสถานะ: <strong style={{ color: '#0f172a' }}>{pendingMove.targetStatus}</strong>
                </p>
              </div>
            </div>
            
            <div className="form-group" style={{ marginTop: 24 }}>
              <label className="form-label">ชื่อผู้ดำเนินการในขั้นตอนนี้ *</label>
              <input
                className="form-input"
                value={moveAssignee}
                onChange={e => setMoveAssignee(e.target.value)}
                placeholder="เช่น ช่างเอก, น้องเอ"
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 28 }}>
              <button className="btn" onClick={() => setPendingMove(null)} style={{ minHeight: 44 }}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={confirmMoveJob} style={{ minHeight: 44 }}>บันทึกและย้าย</button>
            </div>
          </div>
        </div>
      )}

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
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ImagePlus size={14} /> รูปภาพ Cover</label>
            <div
              onClick={() => coverInputRef.current?.click()}
              style={{
                border: '2px dashed #d1d5db', borderRadius: 10, padding: coverPreview ? '8px' : '16px',
                textAlign: 'center', cursor: 'pointer', background: '#fafafa', transition: 'all 0.2s',
              }}
            >
              <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={async e => {
                const file = e.target.files?.[0]
                if (file) {
                  try {
                    const compressed = await compressImage(file, 1, 1280)
                    setCoverFile(compressed)
                    const reader = new FileReader()
                    reader.onload = (ev) => setCoverPreview(ev.target?.result as string)
                    reader.readAsDataURL(compressed)
                  } catch {
                    toast.error('บีบอัดรูปไม่สำเร็จ')
                  }
                }
              }} style={{ display: 'none' }} />
              {coverPreview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={coverPreview} alt="Cover Preview" style={{ maxHeight: 100, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }} />
                  <button onClick={(e) => {
                    e.stopPropagation()
                    setCoverFile(null); setCoverPreview(null)
                    if (editJob?.cover_image_url) {
                      jobApi.deleteCover(editJob.id).then(() => { toast.success('ลบรูป cover แล้ว'); fetchJobsAndStatuses() }).catch(() => toast.error('ลบรูปไม่สำเร็จ'))
                    }
                  }} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <>
                  <ImagePlus size={20} color="#94a3b8" style={{ marginBottom: 4 }} />
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>คลิกเพื่อเลือกรูป (JPEG, PNG, WebP, GIF — บีบอัดอัตโนมัติ)</p>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}><button className="btn" onClick={() => setShowModal(false)} style={{ minHeight: 44 }}>ยกเลิก</button><button className="btn btn-primary" onClick={save} style={{ minHeight: 44 }}>{editJob ? 'บันทึก' : 'เพิ่ม'}</button></div>
        </div></div>
      )}

      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
          <h3 style={{ marginBottom: 20 }}>{editStatus ? 'แก้ไขคอลัมน์สถานะ' : 'เพิ่มคอลัมน์สถานะใหม่'}</h3>
          <div className="form-group"><label className="form-label">ชื่อสถานะ</label><input className="form-input" value={statusForm.name} onChange={e => setStatusForm({ ...statusForm, name: e.target.value })} placeholder="เช่น รอออกแบบ, กำลังพิมพ์" autoFocus /></div>
          <div className="form-group"><label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Palette size={14} /> สีประจำสถานะ</label>
            <input type="color" className="form-input" value={statusForm.color} onChange={e => setStatusForm({ ...statusForm, color: e.target.value })} style={{ height: 44, padding: 4 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}><button className="btn" onClick={() => setShowStatusModal(false)} style={{ minHeight: 44 }}>ยกเลิก</button><button className="btn btn-primary" onClick={saveStatus} style={{ minHeight: 44 }}>{editStatus ? 'บันทึก' : 'เพิ่มสถานะ'}</button></div>
        </div></div>
      )}

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

      {printReceiptJob && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
          <div ref={receiptRef} style={{
            fontFamily: "'Sarabun', sans-serif",
            width: 794, padding: '40px 50px', background: 'white', color: 'black', fontSize: 14, lineHeight: 1.6,
          }}>
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>ใบเสร็จรับเงิน / RECEIPT</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>วันที่: {new Date().toLocaleDateString('th-TH', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
            <hr style={{ border: 'none', borderTop: '2px solid #222', margin: '10px 0 20px 0' }} />

            {printReceiptJob.quotation_id && (
              <div style={{ fontSize: 13, marginBottom: 12, color: '#444' }}>
                <b>อ้างอิงใบเสนอราคา / Quotation Ref:</b> QT #{printReceiptJob.quotation_id}
              </div>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ border: '1px solid #999', padding: '8px 6px', width: 40, textAlign: 'center' }}>ที่</th>
                  <th style={{ border: '1px solid #999', padding: '8px 6px', textAlign: 'left' }}>รายการ / Description</th>
                  <th style={{ border: '1px solid #999', padding: '8px 6px', width: 110, textAlign: 'right' }}>ราคา / Amount</th>
                </tr>
              </thead>
              <tbody>
                {receiptJobs.map((rj, idx) => (
                  <tr key={rj.id}>
                    <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #999', padding: '6px 8px' }}>
                      <div style={{ fontWeight: 600 }}>{rj.title}</div>
                      {rj.description && <div style={{ fontSize: 11, color: '#666' }}>{rj.description}</div>}
                    </td>
                    <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{fmtNum(rj.price || 0)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8f8f8' }}>
                  <td colSpan={2} style={{ border: '1px solid #999', padding: '10px 8px', textAlign: 'right', fontWeight: 700, fontSize: 15 }}>
                    รวมสุทธิ / Grand Total
                  </td>
                  <td style={{ border: '1px solid #999', padding: '10px 8px', textAlign: 'right', fontWeight: 700, fontSize: 16 }}>
                    {fmtNum(receiptTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>

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

      {/* Cover Image Lightbox */}
      {coverLightbox && (
        <div className="modal-overlay" onClick={() => setCoverLightbox(null)} style={{ background: 'rgba(0,0,0,0.85)', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button
              onClick={() => setCoverLightbox(null)}
              style={{ position: 'absolute', top: -12, right: -12, width: 32, height: 32, borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', zIndex: 10 }}
            >
              <X size={16} />
            </button>
            <img src={coverLightbox} alt="Cover" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain' }} />
          </div>
        </div>
      )}
    </div>
  )
}
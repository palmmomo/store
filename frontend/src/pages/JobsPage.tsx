import { useState, useEffect } from 'react'
import { jobApi } from '../api/client'
import type { Job } from '../types'
import { KanbanSquare, Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors,
  useDroppable, type DragEndEvent, type DragStartEvent
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const COLUMNS = ['รับงาน/ทำแบบ', 'เตรียมสี/วัสดุ', 'ลงมือสกรีน', 'อบแห้ง/QC', 'งานเสร็จพร้อมส่ง']
const COL_COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#8b5cf6', '#10b981']
const PAY_BORDER: Record<string, string> = { paid: '#10b981', deposit: '#f59e0b', unpaid: '#ef4444' }
const PAY_LABEL: Record<string, string> = { paid: 'ชำระแล้ว', deposit: 'มัดจำ', unpaid: 'ยังไม่ชำระ' }

function DroppableColumn({ col, colIdx, children }: { col: string; colIdx: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: col })
  return (
    <div ref={setNodeRef} className="kanban-column" style={{
      background: isOver ? '#e0f2fe' : '#f8f9fb',
      borderRadius: 10, padding: 10, minHeight: 300,
      border: isOver ? '2px dashed #3b82f6' : '2px solid transparent',
      transition: 'all 0.2s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '4px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: COL_COLORS[colIdx] }} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>{col}</span>
        </div>
      </div>
      {children}
    </div>
  )
}

function JobCard({ job, onEdit, onDelete, isDragging }: { job: Job; onEdit?: () => void; onDelete?: () => void; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } = useSortable({ id: job.id })
  const style = {
    transform: CSS.Transform.toString(transform), transition,
    opacity: isSortDragging ? 0.4 : 1,
  }
  const fmtPrice = (n: number) => n > 0 ? `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 0 })}` : ''

  return (
    <div ref={setNodeRef} style={{
      ...style,
      background: 'white', borderRadius: 8, padding: '10px 12px',
      border: '1px solid var(--border)',
      borderLeft: `4px solid ${PAY_BORDER[job.payment_status] || '#94a3b8'}`,
      marginBottom: 6, cursor: 'default',
      boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.15)' : 'none',
    }} {...attributes}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span {...listeners} style={{ cursor: 'grab', color: 'var(--text-muted)', flexShrink: 0 }}><GripVertical size={14} /></span>
            <span style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</span>
          </div>
          {job.description && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{job.description}</p>}
        </div>
        {!isDragging && (
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            <button className="btn-icon" onClick={onEdit} style={{ width: 22, height: 22 }}><Pencil size={11} /></button>
            <button className="btn-icon delete" onClick={onDelete} style={{ width: 22, height: 22 }}><Trash2 size={11} /></button>
          </div>
        )}
      </div>
      <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: `${PAY_BORDER[job.payment_status]}15`, color: PAY_BORDER[job.payment_status], fontWeight: 600 }}>{PAY_LABEL[job.payment_status]}</span>
        {job.price > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: '#059669' }}>{fmtPrice(job.price)}</span>}
      </div>
    </div>
  )
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editJob, setEditJob] = useState<Job | null>(null)
  const [form, setForm] = useState({ title: '', description: '', payment_status: 'unpaid', status: 'รับงาน/ทำแบบ', price: '' })
  const [activeId, setActiveId] = useState<number | null>(null)
  const [activeColumn, setActiveColumn] = useState(0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const fetchJobs = async () => {
    try { const r = await jobApi.getAll(); setJobs(r.data || []) }
    catch { toast.error('โหลดข้อมูลไม่สำเร็จ') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchJobs() }, [])

  const openAdd = (status?: string) => {
    setEditJob(null)
    setForm({ title: '', description: '', payment_status: 'unpaid', status: status || 'รับงาน/ทำแบบ', price: '' })
    setShowModal(true)
  }
  const openEdit = (j: Job) => {
    setEditJob(j)
    setForm({ title: j.title, description: j.description, payment_status: j.payment_status, status: j.status, price: j.price > 0 ? String(j.price) : '' })
    setShowModal(true)
  }

  const save = async () => {
    if (!form.title.trim()) { toast.error('กรอกชื่องาน'); return }
    const payload = { ...form, price: parseFloat(form.price) || 0 }
    try {
      if (editJob) { await jobApi.update(editJob.id, payload); toast.success('แก้ไขสำเร็จ') }
      else { await jobApi.create(payload); toast.success('เพิ่มงานสำเร็จ') }
      setShowModal(false); fetchJobs()
    } catch { toast.error('บันทึกไม่สำเร็จ') }
  }

  const del = async (id: number) => {
    if (!confirm('ลบงานนี้?')) return
    try { await jobApi.delete(id); toast.success('ลบสำเร็จ'); fetchJobs() } catch { toast.error('ลบไม่สำเร็จ') }
  }

  const handleDragStart = (event: DragStartEvent) => { setActiveId(event.active.id as number) }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const jobId = active.id as number
    const overStr = String(over.id)
    // Find target column (either the droppable column or a job's column)
    let targetColumn = COLUMNS.find(col => col === overStr)
    if (!targetColumn) {
      // Dropped on a job — find that job's column
      const overJob = jobs.find(j => j.id === Number(over.id))
      if (overJob) targetColumn = overJob.status
    }
    if (targetColumn) {
      const job = jobs.find(j => j.id === jobId)
      if (job && job.status !== targetColumn) {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: targetColumn } : j))
        try {
          await jobApi.update(jobId, { title: job.title, description: job.description, status: targetColumn, payment_status: job.payment_status, price: job.price })
        } catch { toast.error('อัปเดตไม่สำเร็จ'); fetchJobs() }
      }
    }
  }

  const activeJob = activeId ? jobs.find(j => j.id === activeId) : null

  return (
    <div>
      <div className="page-header">
        <div><h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><KanbanSquare size={22} /> การดำเนินงาน</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>Kanban Board — ลากการ์ดเพื่อเปลี่ยนสถานะ</p></div>
        <button className="btn btn-primary" onClick={() => openAdd()}><Plus size={16} /> เพิ่มงาน</button>
      </div>

      {loading ? <div className="card"><p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>กำลังโหลด...</p></div> : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="kanban-board" style={{ display: 'grid', gridTemplateColumns: `repeat(${COLUMNS.length}, 1fr)`, minWidth: 'min-content' }} onScroll={(e) => {
            const target = e.currentTarget;
            const scrollLeft = target.scrollLeft;
            const width = target.offsetWidth;
            setActiveColumn(Math.round(scrollLeft / width));
          }}>
            {COLUMNS.map((col, ci) => {
              const colJobs = jobs.filter(j => j.status === col)
              return (
                <DroppableColumn key={col} col={col} colIdx={ci}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '1px 6px', borderRadius: 10 }}>{colJobs.length} งาน</span>
                    <button onClick={() => openAdd(col)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}><Plus size={14} /></button>
                  </div>
                  <SortableContext items={colJobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
                    <div style={{ minHeight: 40 }}>
                      {colJobs.map(j => <JobCard key={j.id} job={j} onEdit={() => openEdit(j)} onDelete={() => del(j.id)} />)}
                    </div>
                  </SortableContext>
                </DroppableColumn>
              )
            })}
          </div>
          <DragOverlay>
            {activeJob ? <JobCard job={activeJob} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Mobile Kanban dots */}
      <div className="kanban-dots">
        {COLUMNS.map((_, i) => (
          <span key={i} className={`dot ${activeColumn === i ? 'active' : ''}`} />
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
          <h3 style={{ marginBottom: 20 }}>{editJob ? 'แก้ไขงาน' : 'เพิ่มงานใหม่'}</h3>
          <div className="form-group"><label className="form-label">ชื่องาน *</label><input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="เช่น ป้ายร้าน ABC" autoFocus /></div>
          <div className="form-group"><label className="form-label">รายละเอียด</label><textarea className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} style={{ resize: 'vertical', fontFamily: 'inherit' }} /></div>
          <div className="form-group"><label className="form-label">ราคางาน (บาท)</label><input className="form-input qty-input" type="number" inputMode="decimal" min="0" step="any" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group"><label className="form-label">สถานะงาน</label>
              <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">การชำระเงิน</label>
              <select className="form-input" value={form.payment_status} onChange={e => setForm({ ...form, payment_status: e.target.value })}>
                <option value="unpaid">ยังไม่ชำระ</option><option value="deposit">มัดจำ</option><option value="paid">ชำระแล้ว</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}><button className="btn" onClick={() => setShowModal(false)}>ยกเลิก</button><button className="btn btn-primary" onClick={save}>{editJob ? 'บันทึก' : 'เพิ่ม'}</button></div>
        </div></div>
      )}
    </div>
  )
}

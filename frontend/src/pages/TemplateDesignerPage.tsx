import { useState, useEffect, useCallback } from 'react'
import { branchApi, quoteTemplateApi, quoteDraftApi } from '../api/client'
import type { Branch, QuoteDraft } from '../types'
import CanvasEditor from '../components/CanvasEditor'
import { Palette, History, RotateCcw, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { jsPDF } from 'jspdf'

export default function TemplateDesignerPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null)
  const [templateData, setTemplateData] = useState<object | null>(null)
  const [loading, setLoading] = useState(true)
  const [canvasKey, setCanvasKey] = useState(0)
  const [drafts, setDrafts] = useState<QuoteDraft[]>([])
  const [showDrafts, setShowDrafts] = useState(false)
  const [loadingDrafts, setLoadingDrafts] = useState(false)

  // Fetch branches
  useEffect(() => {
    branchApi.getAll().then(res => {
      const b = res.data || []
      setBranches(b)
      if (b.length > 0) setSelectedBranch(b[0].id)
    }).catch(() => toast.error('โหลดสาขาไม่สำเร็จ'))
    .finally(() => setLoading(false))
  }, [])

  // Load template when branch changes
  const loadTemplate = useCallback(async (branchId: number) => {
    try {
      const res = await quoteTemplateApi.get(branchId)
      if (res.data && res.data.canvas_json) {
        setTemplateData(res.data.canvas_json)
      } else {
        setTemplateData(null)
      }
    } catch {
      setTemplateData(null)
    }
    setCanvasKey(prev => prev + 1) // force remount
  }, [])

  useEffect(() => {
    if (selectedBranch) loadTemplate(selectedBranch)
  }, [selectedBranch, loadTemplate])

  // Save template
  const handleSave = async (json: object) => {
    if (!selectedBranch) return
    try {
      await quoteTemplateApi.save(selectedBranch, { canvas_json: json })
      toast.success('บันทึกแบบสำเร็จ')
    } catch (err: any) {
      toast.error('บันทึกไม่สำเร็จ')
    }
  }

  // Save draft
  const handleSaveDraft = async (json: object, label: string) => {
    if (!selectedBranch) return
    try {
      await quoteDraftApi.create(selectedBranch, { canvas_json: json, label })
      toast.success('บันทึกร่างสำเร็จ')
    } catch {
      toast.error('บันทึกร่างไม่สำเร็จ')
    }
  }

  // Export PDF
  const handleExportPDF = (dataUrl: string) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pw = pdf.internal.pageSize.getWidth()
      const ph = pdf.internal.pageSize.getHeight()
      pdf.addImage(dataUrl, 'PNG', 0, 0, pw, ph)
      // Create blob with explicit PDF MIME type
      const pdfOutput = pdf.output('arraybuffer')
      const blob = new Blob([pdfOutput], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // Use safe ASCII filename to avoid encoding issues
      const branchId = selectedBranch || 0
      a.download = `quote-template-branch${branchId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.success('ส่งออก PDF สำเร็จ')
    } catch {
      toast.error('ส่งออก PDF ไม่สำเร็จ')
    }
  }

  // Load drafts
  const openDrafts = async () => {
    if (!selectedBranch) return
    setShowDrafts(true)
    setLoadingDrafts(true)
    try {
      const res = await quoteDraftApi.getAll(selectedBranch)
      setDrafts(res.data || [])
    } catch {
      setDrafts([])
    }
    setLoadingDrafts(false)
  }

  // Restore draft
  const restoreDraft = async (draftId: number) => {
    if (!selectedBranch) return
    try {
      const res = await quoteDraftApi.get(selectedBranch, draftId)
      if (res.data?.canvas_json) {
        setTemplateData(res.data.canvas_json)
        setCanvasKey(prev => prev + 1)
        setShowDrafts(false)
        toast.success('โหลดร่างสำเร็จ')
      }
    } catch {
      toast.error('โหลดร่างไม่สำเร็จ')
    }
  }

  // Delete draft
  const deleteDraft = async (draftId: number) => {
    if (!selectedBranch) return
    if (!confirm('ลบแบบร่างนี้?')) return
    try {
      await quoteDraftApi.delete(selectedBranch, draftId)
      setDrafts(prev => prev.filter(d => d.id !== draftId))
      toast.success('ลบร่างสำเร็จ')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'ลบร่างไม่สำเร็จ')
    }
  }

  const currentBranch = branches.find(b => b.id === selectedBranch)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}><p style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p></div>
  }

  return (
    <div className="td-page">
      {/* Top Bar */}
      <div className="td-topbar">
        <div className="td-topbar-left">
          <Palette size={20} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>แบบใบเสนอราคา</h2>
        </div>
        <div className="td-topbar-center">
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>สาขา:</label>
          <select
            className="form-input"
            value={selectedBranch || ''}
            onChange={e => setSelectedBranch(parseInt(e.target.value))}
            style={{ width: 200, fontSize: 13 }}
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="td-topbar-right">
          <button className="btn btn-secondary" onClick={openDrafts}>
            <History size={14} /> ประวัติร่าง
          </button>
        </div>
      </div>

      {branches.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ color: 'var(--text-muted)' }}>ยังไม่มีสาขา กรุณาสร้างสาขาก่อน</p>
        </div>
      ) : (
        <CanvasEditor
          key={canvasKey}
          initialData={templateData}
          branchName={currentBranch?.name || ''}
          onSave={handleSave}
          onSaveDraft={handleSaveDraft}
          onExportPDF={handleExportPDF}
        />
      )}

      {/* Draft History Modal */}
      {showDrafts && (
        <div className="modal-overlay" onClick={() => setShowDrafts(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><History size={18} /> ประวัติร่าง — {currentBranch?.name}</h3>
              <button className="btn btn-sm" onClick={() => setShowDrafts(false)}><X size={14} /></button>
            </div>
            {loadingDrafts ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>กำลังโหลด...</p>
            ) : drafts.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>ยังไม่มีร่างที่บันทึก</p>
            ) : (
              <div className="td-draft-list">
                {drafts.map(d => (
                  <div key={d.id} className="td-draft-item">
                    <div className="td-draft-info">
                      <div className="td-draft-name">{d.label || `ร่าง #${d.id}`}</div>
                      <div className="td-draft-date">{fmtDate(d.saved_at)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm btn-primary" onClick={() => restoreDraft(d.id)} title="โหลดร่างนี้"><RotateCcw size={12} /> โหลด</button>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteDraft(d.id)} title="ลบร่าง"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

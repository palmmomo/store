import { useEffect, useRef, useState, useCallback } from 'react'
import { Canvas, Textbox, Rect, Line, Circle, FabricImage, type FabricObject } from 'fabric'
import {
  Type, Image as ImageIcon, Square, Minus, CircleIcon,
  Undo2, Redo2, Layers, Trash2, Lock, Unlock,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic,
  ChevronUp, ChevronDown, Download, Save, List, MousePointer
} from 'lucide-react'

const A4_WIDTH = 794
const A4_HEIGHT = 1123
const GRID_SIZE = 10
const MAX_HISTORY = 30

// Custom property key for locked elements
const LOCKED_KEY = '_isLocked'
const LOCKED_TYPE_KEY = '_lockedType'

interface CanvasEditorProps {
  initialData?: object | null
  branchName?: string
  onSave: (json: object) => void
  onSaveDraft: (json: object, label: string) => void
  onExportPDF: (dataUrl: string) => void
}

function createLockedElements(branchName: string): FabricObject[] {
  const elements: FabricObject[] = []

  // Company Name / Logo
  const companyName = new Textbox('ชื่อบริษัท / Company Name', {
    left: 160, top: 30, width: 474, fontSize: 22, fontWeight: 'bold',
    fontFamily: 'Sarabun, Inter, sans-serif', textAlign: 'center',
    fill: '#1a1a2e',
  })
  ;(companyName as any)[LOCKED_KEY] = true
  ;(companyName as any)[LOCKED_TYPE_KEY] = 'company_name'
  elements.push(companyName)

  // Branch Name
  const branch = new Textbox(branchName || 'ชื่อสาขา', {
    left: 160, top: 60, width: 474, fontSize: 13, fontFamily: 'Sarabun, Inter, sans-serif',
    textAlign: 'center', fill: '#444',
  })
  ;(branch as any)[LOCKED_KEY] = true
  ;(branch as any)[LOCKED_TYPE_KEY] = 'branch_name'
  elements.push(branch)

  // Address + Phone + Tax
  const addressLine = new Textbox('ที่อยู่ | โทร. | เลขผู้เสียภาษี', {
    left: 160, top: 80, width: 474, fontSize: 11, fontFamily: 'Sarabun, Inter, sans-serif',
    textAlign: 'center', fill: '#666',
  })
  ;(addressLine as any)[LOCKED_KEY] = true
  ;(addressLine as any)[LOCKED_TYPE_KEY] = 'company_address'
  elements.push(addressLine)

  // Horizontal line
  const hrLine = new Line([50, 110, 744, 110], {
    stroke: '#333', strokeWidth: 2,
  })
  ;(hrLine as any)[LOCKED_KEY] = true
  ;(hrLine as any)[LOCKED_TYPE_KEY] = 'header_line'
  elements.push(hrLine)

  // Title
  const title = new Textbox('ใบเสนอราคา / QUOTATION', {
    left: 180, top: 120, width: 434, fontSize: 22, fontWeight: 'bold',
    fontFamily: 'Sarabun, Inter, sans-serif', textAlign: 'center', fill: '#1a1a2e',
  })
  ;(title as any)[LOCKED_KEY] = true
  ;(title as any)[LOCKED_TYPE_KEY] = 'title'
  elements.push(title)

  // Quote Number
  const quoteNo = new Textbox('เลขที่: QT-XXXXXXX', {
    left: 540, top: 160, width: 210, fontSize: 13,
    fontFamily: 'Sarabun, Inter, sans-serif', textAlign: 'right', fill: '#1a1a2e',
  })
  ;(quoteNo as any)[LOCKED_KEY] = true
  ;(quoteNo as any)[LOCKED_TYPE_KEY] = 'quote_number'
  elements.push(quoteNo)

  // Date
  const dateField = new Textbox('วันที่/Date: XX เดือน XXXX', {
    left: 540, top: 180, width: 210, fontSize: 13,
    fontFamily: 'Sarabun, Inter, sans-serif', textAlign: 'right', fill: '#1a1a2e',
  })
  ;(dateField as any)[LOCKED_KEY] = true
  ;(dateField as any)[LOCKED_TYPE_KEY] = 'date'
  elements.push(dateField)

  // Customer name/address
  const customer = new Textbox('ผู้ซื้อ/Customer: ___________\nที่อยู่/Address: ___________\nเลขผู้เสียภาษี: ___________', {
    left: 50, top: 160, width: 400, fontSize: 13, lineHeight: 1.6,
    fontFamily: 'Sarabun, Inter, sans-serif', fill: '#1a1a2e',
  })
  ;(customer as any)[LOCKED_KEY] = true
  ;(customer as any)[LOCKED_TYPE_KEY] = 'customer_info'
  elements.push(customer)

  // Items Table Header Background
  const tableHeader = new Rect({
    left: 50, top: 260, width: 694, height: 40,
    fill: '#f0f0f0', stroke: '#999', strokeWidth: 1,
  })
  ;(tableHeader as any)[LOCKED_KEY] = true
  ;(tableHeader as any)[LOCKED_TYPE_KEY] = 'table_header_bg'
  elements.push(tableHeader)

  // Table Header Text
  const headerText = new Textbox('ที่ | รายการ DESCRIPTION | จำนวน QTY | ราคา/หน่วย PRICE | จำนวนเงิน AMOUNT', {
    left: 55, top: 268, width: 684, fontSize: 11, fontWeight: 'bold',
    fontFamily: 'Sarabun, Inter, sans-serif', fill: '#333', textAlign: 'center',
  })
  ;(headerText as any)[LOCKED_KEY] = true
  ;(headerText as any)[LOCKED_TYPE_KEY] = 'table_header_text'
  elements.push(headerText)

  // Table Body Area
  const tableBody = new Rect({
    left: 50, top: 300, width: 694, height: 300,
    fill: 'transparent', stroke: '#999', strokeWidth: 1,
  })
  ;(tableBody as any)[LOCKED_KEY] = true
  ;(tableBody as any)[LOCKED_TYPE_KEY] = 'table_body'
  elements.push(tableBody)

  // Subtotal area
  const subtotalBg = new Rect({
    left: 50, top: 600, width: 694, height: 50,
    fill: '#f8f8f8', stroke: '#999', strokeWidth: 1,
  })
  ;(subtotalBg as any)[LOCKED_KEY] = true
  ;(subtotalBg as any)[LOCKED_TYPE_KEY] = 'subtotal_bg'
  elements.push(subtotalBg)

  const subtotalText = new Textbox('ตัวอักษร/In Letter: ___________                                                   รวมสุทธิ Grand Total    ฿ 0.00', {
    left: 55, top: 612, width: 684, fontSize: 12,
    fontFamily: 'Sarabun, Inter, sans-serif', fill: '#1a1a2e',
  })
  ;(subtotalText as any)[LOCKED_KEY] = true
  ;(subtotalText as any)[LOCKED_TYPE_KEY] = 'subtotal_text'
  elements.push(subtotalText)

  // Signature area
  const sigText = new Textbox('ผู้เสนอราคา\n\n\n(................................)', {
    left: 520, top: 700, width: 220, fontSize: 13,
    fontFamily: 'Sarabun, Inter, sans-serif', textAlign: 'center', fill: '#1a1a2e',
    lineHeight: 1.5,
  })
  ;(sigText as any)[LOCKED_KEY] = true
  ;(sigText as any)[LOCKED_TYPE_KEY] = 'signature'
  elements.push(sigText)

  return elements
}

export default function CanvasEditor({ initialData, branchName = '', onSave, onSaveDraft, onExportPDF }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<Canvas | null>(null)
  const [selectedObj, setSelectedObj] = useState<FabricObject | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [isUndoRedo, setIsUndoRedo] = useState(false)
  const [draftLabel, setDraftLabel] = useState('')
  const [showDraftInput, setShowDraftInput] = useState(false)
  const [fontSize, setFontSize] = useState(14)
  const [fillColor, setFillColor] = useState('#1a1a2e')
  const [fontFamily, setFontFamily] = useState('Sarabun, Inter, sans-serif')
  const [objectList, setObjectList] = useState<{type: string; label: string; locked: boolean; obj: FabricObject}[]>([])

  const refreshObjectList = useCallback((canvas: Canvas) => {
    const objs = canvas.getObjects()
    const list = objs.map((obj) => {
      const locked = (obj as any)[LOCKED_KEY] === true
      const lockedType = (obj as any)[LOCKED_TYPE_KEY] as string || ''
      let label = ''
      let type = ''
      if (obj instanceof Textbox) {
        type = 'ข้อความ'
        const lockedLabels: Record<string, string> = {
          company_name: 'ชื่อบริษัท', branch_name: 'สาขา', company_address: 'ที่อยู่',
          title: 'หัวข้อ', quote_number: 'เลขที่', date: 'วันที่',
          customer_info: 'ลูกค้า', table_header_text: 'หัวตาราง',
          subtotal_text: 'รวมเงิน', signature: 'ลายเซ็น',
        }
        label = locked && lockedLabels[lockedType] ? lockedLabels[lockedType] : (obj.text || '').substring(0, 20)
      } else if (obj instanceof Rect) {
        type = 'สี่เหลี่ยม'
        const rectLabels: Record<string, string> = { table_header_bg: 'พื้นหัวตาราง', table_body: 'ตารางรายการ', subtotal_bg: 'พื้นรวมเงิน' }
        label = locked && rectLabels[lockedType] ? rectLabels[lockedType] : 'สี่เหลี่ยม'
      } else if (obj instanceof Line) {
        type = 'เส้น'
        label = locked ? 'เส้นแบ่ง' : 'เส้น'
      } else if (obj instanceof Circle) {
        type = 'วงกลม'
        label = 'วงกลม'
      } else {
        type = 'อื่นๆ'
        label = obj.type || 'object'
      }
      return { type, label, locked, obj }
    })
    setObjectList(list)
  }, [])

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = new Canvas(canvasRef.current, {
      width: A4_WIDTH,
      height: A4_HEIGHT,
      backgroundColor: '#ffffff',
      selection: true,
    })
    fabricRef.current = canvas

    // Load initial data or create default
    if (initialData && typeof initialData === 'object' && Object.keys(initialData).length > 0) {
      canvas.loadFromJSON(initialData).then(() => {
        canvas.renderAll()
        saveToHistory(canvas)
        refreshObjectList(canvas)
      })
    } else {
      const locked = createLockedElements(branchName)
      locked.forEach(el => canvas.add(el))
      canvas.renderAll()
      saveToHistory(canvas)
      refreshObjectList(canvas)
    }

    // Event handlers
    canvas.on('selection:created', (e) => {
      const obj = e.selected?.[0] || null
      setSelectedObj(obj)
      if (obj) updatePropertyPanel(obj)
    })
    canvas.on('selection:updated', (e) => {
      const obj = e.selected?.[0] || null
      setSelectedObj(obj)
      if (obj) updatePropertyPanel(obj)
    })
    canvas.on('selection:cleared', () => setSelectedObj(null))

    // Refresh object list on add/remove
    canvas.on('object:added', () => refreshObjectList(canvas))
    canvas.on('object:removed', () => refreshObjectList(canvas))

    // Snap to grid on move
    canvas.on('object:moving', (e) => {
      const obj = e.target
      if (obj) {
        obj.set({
          left: Math.round((obj.left || 0) / GRID_SIZE) * GRID_SIZE,
          top: Math.round((obj.top || 0) / GRID_SIZE) * GRID_SIZE,
        })
      }
    })

    // Save history on modification
    canvas.on('object:modified', () => {
      if (!isUndoRedo) saveToHistory(canvas)
      refreshObjectList(canvas)
    })

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const active = canvas.getActiveObject()
        if (active && !(active as any)[LOCKED_KEY]) {
          canvas.remove(active)
          canvas.discardActiveObject()
          canvas.renderAll()
          saveToHistory(canvas)
        }
        e.preventDefault()
      }
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo() }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      canvas.dispose()
      fabricRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, branchName])

  const updatePropertyPanel = (obj: FabricObject) => {
    if (obj instanceof Textbox) {
      setFontSize(obj.fontSize || 14)
      setFillColor((obj.fill as string) || '#1a1a2e')
      setFontFamily(obj.fontFamily || 'Sarabun, Inter, sans-serif')
    } else {
      setFillColor((obj.fill as string) || '#1a1a2e')
    }
  }

  const saveToHistory = useCallback((canvas: Canvas) => {
    const json = JSON.stringify(canvas.toObject([LOCKED_KEY, LOCKED_TYPE_KEY]))
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIdx + 1)
      newHistory.push(json)
      if (newHistory.length > MAX_HISTORY) newHistory.shift()
      setHistoryIdx(newHistory.length - 1)
      return newHistory
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyIdx])

  const undo = () => {
    if (historyIdx <= 0) return
    const newIdx = historyIdx - 1
    setIsUndoRedo(true)
    fabricRef.current?.loadFromJSON(JSON.parse(history[newIdx])).then(() => {
      fabricRef.current?.renderAll()
      setHistoryIdx(newIdx)
      setIsUndoRedo(false)
    })
  }

  const redo = () => {
    if (historyIdx >= history.length - 1) return
    const newIdx = historyIdx + 1
    setIsUndoRedo(true)
    fabricRef.current?.loadFromJSON(JSON.parse(history[newIdx])).then(() => {
      fabricRef.current?.renderAll()
      setHistoryIdx(newIdx)
      setIsUndoRedo(false)
    })
  }

  // Add elements
  const addText = () => {
    const canvas = fabricRef.current
    if (!canvas) return
    const text = new Textbox('ข้อความ', {
      left: 100, top: 750, width: 200, fontSize: 14,
      fontFamily: 'Sarabun, Inter, sans-serif', fill: '#1a1a2e',
    })
    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
    saveToHistory(canvas)
  }

  const addShape = (type: 'rect' | 'line' | 'circle') => {
    const canvas = fabricRef.current
    if (!canvas) return
    let shape: FabricObject
    if (type === 'rect') {
      shape = new Rect({
        left: 100, top: 750, width: 150, height: 80,
        fill: 'transparent', stroke: '#333', strokeWidth: 1,
        lockUniScaling: false,
      })
    } else if (type === 'line') {
      shape = new Line([100, 800, 400, 800], {
        stroke: '#333', strokeWidth: 2,
      })
    } else {
      shape = new Circle({
        left: 200, top: 750, radius: 40,
        fill: 'transparent', stroke: '#333', strokeWidth: 1,
        lockUniScaling: false,
      })
    }
    canvas.add(shape)
    canvas.setActiveObject(shape)
    canvas.renderAll()
    saveToHistory(canvas)
  }

  const addImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !fabricRef.current) return
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string
        const img = await FabricImage.fromURL(dataUrl)
        img.scaleToWidth(200)
        img.set({ left: 100, top: 750 })
        fabricRef.current!.add(img)
        fabricRef.current!.setActiveObject(img)
        fabricRef.current!.renderAll()
        saveToHistory(fabricRef.current!)
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const deleteSelected = () => {
    const canvas = fabricRef.current
    const obj = canvas?.getActiveObject()
    if (!canvas || !obj) return
    if ((obj as any)[LOCKED_KEY]) return
    canvas.remove(obj)
    canvas.discardActiveObject()
    canvas.renderAll()
    saveToHistory(canvas)
  }

  // Layer controls
  const bringForward = () => {
    const canvas = fabricRef.current
    const obj = canvas?.getActiveObject()
    if (canvas && obj) { canvas.bringObjectForward(obj); canvas.renderAll() }
  }
  const sendBackward = () => {
    const canvas = fabricRef.current
    const obj = canvas?.getActiveObject()
    if (canvas && obj) { canvas.sendObjectBackwards(obj); canvas.renderAll() }
  }

  // Property updates
  const updateFontSize = (size: number) => {
    setFontSize(size)
    if (selectedObj instanceof Textbox) {
      selectedObj.set('fontSize', size)
      fabricRef.current?.renderAll()
    }
  }
  const updateFillColor = (color: string) => {
    setFillColor(color)
    if (selectedObj) {
      if (selectedObj instanceof Textbox) {
        selectedObj.set('fill', color)
      } else {
        selectedObj.set('fill', color)
      }
      fabricRef.current?.renderAll()
    }
  }
  const updateFontFamily = (ff: string) => {
    setFontFamily(ff)
    if (selectedObj instanceof Textbox) {
      selectedObj.set('fontFamily', ff)
      fabricRef.current?.renderAll()
    }
  }
  const toggleBold = () => {
    if (selectedObj instanceof Textbox) {
      selectedObj.set('fontWeight', selectedObj.fontWeight === 'bold' ? 'normal' : 'bold')
      fabricRef.current?.renderAll()
    }
  }
  const toggleItalic = () => {
    if (selectedObj instanceof Textbox) {
      selectedObj.set('fontStyle', selectedObj.fontStyle === 'italic' ? 'normal' : 'italic')
      fabricRef.current?.renderAll()
    }
  }
  const setAlign = (align: string) => {
    if (selectedObj instanceof Textbox) {
      selectedObj.set('textAlign', align)
      fabricRef.current?.renderAll()
    }
  }

  // Save / Export
  const handleSave = () => {
    if (!fabricRef.current) return
    const json = fabricRef.current.toObject([LOCKED_KEY, LOCKED_TYPE_KEY])
    onSave(json)
  }

  const handleSaveDraft = () => {
    if (!fabricRef.current) return
    const json = fabricRef.current.toObject([LOCKED_KEY, LOCKED_TYPE_KEY])
    onSaveDraft(json, draftLabel)
    setDraftLabel('')
    setShowDraftInput(false)
  }

  const handleExportPDF = () => {
    if (!fabricRef.current) return
    const dataUrl = fabricRef.current.toDataURL({
      format: 'png',
      multiplier: 1.5,
      quality: 0.92,
    })
    onExportPDF(dataUrl)
  }

  const isLocked = selectedObj ? (selectedObj as any)[LOCKED_KEY] === true : false
  const isTextbox = selectedObj instanceof Textbox

  return (
    <div className="td-layout">
      {/* Left Toolbar */}
      <div className="td-toolbar-panel">
        <div className="td-toolbar-section">
          <div className="td-toolbar-label">เพิ่มองค์ประกอบ</div>
          <button className="td-tool-btn" onClick={addText} title="เพิ่มข้อความ"><Type size={16} /><span>ข้อความ</span></button>
          <button className="td-tool-btn" onClick={addImage} title="เพิ่มรูปภาพ"><ImageIcon size={16} /><span>รูปภาพ</span></button>
          <button className="td-tool-btn" onClick={() => addShape('rect')} title="สี่เหลี่ยม"><Square size={16} /><span>สี่เหลี่ยม</span></button>
          <button className="td-tool-btn" onClick={() => addShape('line')} title="เส้น"><Minus size={16} /><span>เส้น</span></button>
          <button className="td-tool-btn" onClick={() => addShape('circle')} title="วงกลม"><CircleIcon size={16} /><span>วงกลม</span></button>
        </div>

        <div className="td-toolbar-section">
          <div className="td-toolbar-label">แก้ไข</div>
          <button className="td-tool-btn" onClick={undo} disabled={historyIdx <= 0} title="Undo (Ctrl+Z)"><Undo2 size={16} /><span>Undo</span></button>
          <button className="td-tool-btn" onClick={redo} disabled={historyIdx >= history.length - 1} title="Redo (Ctrl+Y)"><Redo2 size={16} /><span>Redo</span></button>
          <button className="td-tool-btn" onClick={deleteSelected} disabled={!selectedObj || isLocked} title="ลบ"><Trash2 size={16} /><span>ลบ</span></button>
        </div>

        <div className="td-toolbar-section">
          <div className="td-toolbar-label">เลเยอร์</div>
          <button className="td-tool-btn" onClick={bringForward} disabled={!selectedObj} title="ย้ายขึ้น"><ChevronUp size={16} /><span>ย้ายขึ้น</span></button>
          <button className="td-tool-btn" onClick={sendBackward} disabled={!selectedObj} title="ย้ายลง"><ChevronDown size={16} /><span>ย้ายลง</span></button>
        </div>

        <div className="td-toolbar-section td-actions">
          <div className="td-toolbar-label">บันทึก</div>
          <button className="td-tool-btn td-save-btn" onClick={handleSave}><Save size={16} /><span>บันทึกแบบ</span></button>
          <button className="td-tool-btn" onClick={() => setShowDraftInput(true)}><Layers size={16} /><span>บันทึกร่าง</span></button>
          <button className="td-tool-btn td-export-btn" onClick={handleExportPDF}><Download size={16} /><span>ส่งออก PDF</span></button>
        </div>

        {showDraftInput && (
          <div className="td-draft-input">
            <input className="form-input" placeholder="ชื่อร่าง (ถ้ามี)" value={draftLabel} onChange={e => setDraftLabel(e.target.value)} style={{ fontSize: 12 }} />
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              <button className="btn btn-primary btn-sm" onClick={handleSaveDraft}>บันทึก</button>
              <button className="btn btn-sm" onClick={() => setShowDraftInput(false)}>ยกเลิก</button>
            </div>
          </div>
        )}
      </div>

      {/* Canvas Area */}
      <div className="td-canvas-wrapper">
        <div className="td-canvas-paper">
          <canvas ref={canvasRef} id="quote-canvas" />
        </div>
      </div>

      {/* Right Properties Panel */}
      <div className="td-properties-panel">
        {/* Element List */}
        <div className="td-prop-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><List size={14} /> องค์ประกอบทั้งหมด ({objectList.length})</div>
        <div className="td-element-list">
          {objectList.map((item, idx) => (
            <div
              key={idx}
              className={`td-element-item${selectedObj === item.obj ? ' active' : ''}`}
              onClick={() => { fabricRef.current?.setActiveObject(item.obj); fabricRef.current?.renderAll() }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                {item.locked ? <Lock size={10} style={{ color: 'var(--warning)', flexShrink: 0 }} /> : <MousePointer size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                <span className="td-element-label">{item.label}</span>
              </div>
              <span className="td-element-type">{item.type}</span>
            </div>
          ))}
        </div>

        {/* Properties */}
        <div className="td-prop-title" style={{ marginTop: 12 }}>คุณสมบัติ</div>
        {selectedObj ? (
          <>
            <div className="td-prop-info">
              {isLocked && <div className="td-locked-badge"><Lock size={12} /> ล็อค (ลบไม่ได้)</div>}
              {!isLocked && <div className="td-unlocked-badge"><Unlock size={12} /> อิสระ</div>}
            </div>

            {isTextbox && (
              <>
                <div className="td-prop-group">
                  <label className="td-prop-label">ฟอนต์</label>
                  <select className="form-input" value={fontFamily} onChange={e => updateFontFamily(e.target.value)} style={{ fontSize: 11 }}>
                    <option value="Sarabun, Inter, sans-serif">Sarabun</option>
                    <option value="Inter, sans-serif">Inter</option>
                    <option value="serif">Serif</option>
                    <option value="monospace">Monospace</option>
                  </select>
                </div>
                <div className="td-prop-group">
                  <label className="td-prop-label">ขนาด</label>
                  <input className="form-input qty-input" type="number" min={8} max={72} value={fontSize} onChange={e => updateFontSize(parseInt(e.target.value) || 14)} style={{ fontSize: 12 }} />
                </div>
                <div className="td-prop-group">
                  <label className="td-prop-label">สไตล์</label>
                  <div className="td-style-btns">
                    <button className={`td-style-btn ${(selectedObj as Textbox).fontWeight === 'bold' ? 'active' : ''}`} onClick={toggleBold} title="ตัวหนา"><Bold size={14} /></button>
                    <button className={`td-style-btn ${(selectedObj as Textbox).fontStyle === 'italic' ? 'active' : ''}`} onClick={toggleItalic} title="ตัวเอียง"><Italic size={14} /></button>
                  </div>
                </div>
                <div className="td-prop-group">
                  <label className="td-prop-label">จัดตำแหน่ง</label>
                  <div className="td-style-btns">
                    <button className={`td-style-btn ${(selectedObj as Textbox).textAlign === 'left' ? 'active' : ''}`} onClick={() => setAlign('left')}><AlignLeft size={14} /></button>
                    <button className={`td-style-btn ${(selectedObj as Textbox).textAlign === 'center' ? 'active' : ''}`} onClick={() => setAlign('center')}><AlignCenter size={14} /></button>
                    <button className={`td-style-btn ${(selectedObj as Textbox).textAlign === 'right' ? 'active' : ''}`} onClick={() => setAlign('right')}><AlignRight size={14} /></button>
                  </div>
                </div>
              </>
            )}

            <div className="td-prop-group">
              <label className="td-prop-label">สี</label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="color" value={fillColor} onChange={e => updateFillColor(e.target.value)} style={{ width: 32, height: 32, border: 'none', cursor: 'pointer', borderRadius: 4 }} />
                <input className="form-input" value={fillColor} onChange={e => updateFillColor(e.target.value)} style={{ fontSize: 11, flex: 1 }} />
              </div>
            </div>

            <div className="td-prop-group">
              <label className="td-prop-label">ตำแหน่ง</label>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                X: {Math.round(selectedObj.left || 0)} &nbsp; Y: {Math.round(selectedObj.top || 0)}
              </div>
            </div>
          </>
        ) : (
          <div className="td-prop-empty">เลือกองค์ประกอบบน canvas<br />เพื่อแก้ไขคุณสมบัติ</div>
        )}
      </div>
    </div>
  )
}

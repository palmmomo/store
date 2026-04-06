import { useState, useEffect } from 'react'
import { branchApi } from '../api/client'
import { FileText, Download } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function QuotationPage() {
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState<any>(null)
  
  // Customer Info
  const [custName, setCustName] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [custAddress, setCustAddress] = useState('')
  const [custType, setCustType] = useState('เอกชน')
  
  // Signage Info
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [pricePerSqM, setPricePerSqM] = useState('')
  
  // Add-ons
  const [hasInstall, setHasInstall] = useState(false)
  const [installPrice, setInstallPrice] = useState('')
  
  const [hasSteel, setHasSteel] = useState(false)
  const [steelPrice, setSteelPrice] = useState('')
  
  const [hasWood, setHasWood] = useState(false)
  const [woodPrice, setWoodPrice] = useState('')
  
  const [hasOther, setHasOther] = useState(false)
  const [otherLabel, setOtherLabel] = useState('อื่นๆ')
  const [otherPrice, setOtherPrice] = useState('')

  useEffect(() => {
    branchApi.getAll().then(res => setBranches(res.data || []))
  }, [])

  // Calculations
  const w = parseFloat(width) || 0
  const h = parseFloat(height) || 0
  const area = w * h
  const pps = parseFloat(pricePerSqM) || 0
  const signTotal = area * pps
  
  const addOnTotal = 
    (hasInstall ? parseFloat(installPrice) || 0 : 0) +
    (hasSteel ? parseFloat(steelPrice) || 0 : 0) +
    (hasWood ? parseFloat(woodPrice) || 0 : 0) +
    (hasOther ? parseFloat(otherPrice) || 0 : 0)
    
  const grandTotal = signTotal + addOnTotal

  const generatePDF = () => {
    const doc = new jsPDF()

    // Header Logo
    if (selectedBranch?.logo_url) {
      try {
        doc.addImage(selectedBranch.logo_url, 'PNG', 15, 10, 30, 30) // Assuming PNG or JPEG
      } catch (err) {
        console.warn('Could not load logo image for PDF:', err)
      }
    }

    // Branch Name Header
    doc.setFontSize(16)
    if (selectedBranch) {
      doc.text(selectedBranch.name, 50, 18)
      doc.setFontSize(10)
      if (selectedBranch.address) doc.text(selectedBranch.address, 50, 25)
    }

    // Quotation ID
    const today = new Date()
    const qtId = `QT-${today.getFullYear()}${String(today.getMonth()+1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random()*1000)).padStart(3, '0')}`
    doc.setFontSize(20)
    doc.text('ใบเสนอราคา', 195, 20, { align: 'right' })
    doc.setFontSize(12)
    doc.text(`เลขที่: ${qtId}`, 195, 28, { align: 'right' })

    // Customer Info
    doc.setFontSize(10)
    doc.text(`ชื่อลูกค้า: ${custName || '-'}`, 15, 50)
    doc.text(`เบอร์โทร: ${custPhone || '-'}`, 15, 57)
    doc.text(`ประเภทลูกค้า: ${custType}`, 120, 50)

    // Setup Table Data
    const tableBody = []
    
    // 1. Signage
    if (signTotal > 0) {
      tableBody.push([
        `งานพิมพ์ป้าย`,
        `${w.toFixed(2)}`,
        `${h.toFixed(2)}`,
        `${area.toFixed(2)}`,
        `${pps.toLocaleString()}`,
        `${signTotal.toLocaleString()}`
      ])
    }
    
    // Add-ons
    if (hasInstall) tableBody.push(['ค่าติดตั้ง', '-', '-', '-', '-', parseFloat(installPrice || '0').toLocaleString()])
    if (hasSteel) tableBody.push(['ค่าโครงเหล็ก', '-', '-', '-', '-', parseFloat(steelPrice || '0').toLocaleString()])
    if (hasWood) tableBody.push(['ค่าโครงไม้', '-', '-', '-', '-', parseFloat(woodPrice || '0').toLocaleString()])
    if (hasOther) tableBody.push([otherLabel || 'อื่นๆ', '-', '-', '-', '-', parseFloat(otherPrice || '0').toLocaleString()])

    autoTable(doc, {
      startY: 65,
      head: [['รายการ', 'กว้าง(ม.)', 'ยาว(ม.)', 'ตร.ม.', 'ราคา/ตร.ม.', 'ยอดรวม']],
      body: tableBody,
      theme: 'grid',
      styles: { font: 'helvetica' }, // Use helvetica fallback for missing TH fonts for now
      headStyles: { fillColor: [41, 128, 185] }
    })

    // Total
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY || 65
    doc.setFontSize(12)
    doc.text(`ยอดรวมสุทธิ: ${grandTotal.toLocaleString()} บาท`, 195, finalY + 15, { align: 'right' })

    // Footer
    doc.setFontSize(10)
    doc.text(`วันที่ออกเอกสาร: ${today.toLocaleDateString()}`, 15, 280)
    doc.text(`ขอบคุณที่ใช้บริการ`, 195, 280, { align: 'right' })

    doc.save(`${qtId}.pdf`)
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">สร้างใบเสนอราคา (PDF)</h1>
          <p className="page-subtitle">ออกใบเสนอราคาให้ลูกค้า พร้อมรูปแบบมาตรฐาน</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 24, alignItems: 'start' }}>
        
        {/* Left Side: Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div className="card">
            <h2 style={{ fontSize: 16, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
              <FileText size={18} /> ข้อมูลลูกค้า
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">ชื่อลูกค้า</label>
                <input className="form-input" value={custName} onChange={e => setCustName(e.target.value)} placeholder="ชื่อ นามสกุล / ชื่อบริษัท" />
              </div>
              <div className="form-group">
                <label className="form-label">เบอร์โทรศัพท์</label>
                <input className="form-input" value={custPhone} onChange={e => setCustPhone(e.target.value)} placeholder="08x-xxx-xxxx" />
              </div>
            </div>
            
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">ประเภทลูกค้า</label>
              <select className="form-input" value={custType} onChange={e => setCustType(e.target.value)}>
                <option value="เอกชน">เอกชน</option>
                <option value="ราชการ">ส่วนราชการ</option>
                <option value="อบต.">อบต. / หน่วยงานท้องถิ่น</option>
              </select>
            </div>

            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">ที่อยู่จัดส่ง / ติดตั้ง</label>
              <textarea className="form-input" rows={2} value={custAddress} onChange={e => setCustAddress(e.target.value)} placeholder="ระบุที่อยู่ครบถ้วน..." />
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 16, marginBottom: 16 }}>ข้อมูลป้าย / งานพิมพ์</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">ความกว้าง (เมตร)</label>
                <input type="number" min="0" step="0.01" className="form-input" value={width} onChange={e => setWidth(e.target.value)} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">ความยาว (เมตร)</label>
                <input type="number" min="0" step="0.01" className="form-input" value={height} onChange={e => setHeight(e.target.value)} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">ราคา/ตร.ม. (บาท)</label>
                <input type="number" min="0" step="0.01" className="form-input" value={pricePerSqM} onChange={e => setPricePerSqM(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div style={{ background: 'var(--bg-box)', padding: 12, borderRadius: 'var(--radius-sm)', marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
              <div>พื้นที่รวม: <strong>{area > 0 ? area.toFixed(2) : '0.00'} ตร.ม.</strong></div>
              <div>ราคาป้าย: <strong>{signTotal > 0 ? signTotal.toLocaleString() : '0'} บาท</strong></div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 16, marginBottom: 16 }}>Add-on Costs (ค่าใช้จ่ายเพิ่มเติม)</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="checkbox" id="c-install" checked={hasInstall} onChange={e => setHasInstall(e.target.checked)} style={{ width: 18, height: 18 }} />
                <label htmlFor="c-install" style={{ flex: 1, cursor: 'pointer' }}>ค่าช่างติดตั้ง</label>
                {hasInstall && <input type="number" min="0" className="form-input" style={{ width: 120, padding: '4px 8px' }} placeholder="บาท" value={installPrice} onChange={e => setInstallPrice(e.target.value)} />}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="checkbox" id="c-steel" checked={hasSteel} onChange={e => setHasSteel(e.target.checked)} style={{ width: 18, height: 18 }} />
                <label htmlFor="c-steel" style={{ flex: 1, cursor: 'pointer' }}>ค่าโครงเหล็ก</label>
                {hasSteel && <input type="number" min="0" className="form-input" style={{ width: 120, padding: '4px 8px' }} placeholder="บาท" value={steelPrice} onChange={e => setSteelPrice(e.target.value)} />}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="checkbox" id="c-wood" checked={hasWood} onChange={e => setHasWood(e.target.checked)} style={{ width: 18, height: 18 }} />
                <label htmlFor="c-wood" style={{ flex: 1, cursor: 'pointer' }}>ค่าโครงไม้</label>
                {hasWood && <input type="number" min="0" className="form-input" style={{ width: 120, padding: '4px 8px' }} placeholder="บาท" value={woodPrice} onChange={e => setWoodPrice(e.target.value)} />}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="checkbox" id="c-other" checked={hasOther} onChange={e => setHasOther(e.target.checked)} style={{ width: 18, height: 18 }} />
                {hasOther ? (
                  <input className="form-input" style={{ flex: 1, padding: '4px 8px' }} value={otherLabel} onChange={e => setOtherLabel(e.target.value)} />
                ) : (
                  <label htmlFor="c-other" style={{ flex: 1, cursor: 'pointer' }}>อื่นๆ</label>
                )}
                {hasOther && <input type="number" min="0" className="form-input" style={{ width: 120, padding: '4px 8px' }} placeholder="บาท" value={otherPrice} onChange={e => setOtherPrice(e.target.value)} />}
              </div>

            </div>
          </div>

        </div>

        {/* Right Side: Summary & Actions */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div className="card">
            <h3 style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>ออกในนามสาขา</h3>
            <select className="form-input" value={selectedBranch?.id || ''} onChange={e => setSelectedBranch(branches.find(b => b.id === e.target.value))}>
              <option value="">-- เลือกสาขา --</option>
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="card" style={{ background: 'var(--bg-box)' }}>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>สรุปยอดรวม</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: 'var(--text-muted)' }}>
              <span>ราคาป้าย</span>
              <span>{signTotal.toLocaleString()}.-</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14, color: 'var(--text-muted)' }}>
              <span>ค่า Add-on รวม</span>
              <span>{addOnTotal.toLocaleString()}.-</span>
            </div>
            
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, color: 'var(--primary)' }}>
              <span>ยอดสุทธิ</span>
              <span>{grandTotal.toLocaleString()} บาท</span>
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ padding: '16px', fontSize: 16, display: 'flex', justifyContent: 'center', fontWeight: 'bold' }}
            disabled={grandTotal <= 0 || !selectedBranch}
            onClick={generatePDF}
          >
            <Download size={20} /> ดาวน์โหลด PDF
          </button>
          
          {!selectedBranch && <p style={{ fontSize: 12, color: 'red', textAlign: 'center', margin: 0 }}>* กรุณาเลือกสาขาประทับตรา</p>}

        </div>

      </div>
    </div>
  )
}

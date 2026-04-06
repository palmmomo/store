import { useState, useEffect, useRef } from 'react'
import { branchApi } from '../api/client'
import { FileText, Printer } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'

interface QuotationItem {
  id: number
  name: string
  width: number
  height: number
  area: number
  pricePerSqM: number
  total: number
}

interface AddOnItem {
  name: string
  price: number
}

export default function QuotationPage() {
  const printRef = useRef<HTMLDivElement>(null)
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState<any>(null)
  
  // Customer Info
  const [custName, setCustName] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [custType, setCustType] = useState('เอกชน')
  
  // Items
  const [items, setItems] = useState<QuotationItem[]>([])
  const [itemName, setItemName] = useState('')
  const [itemWidth, setItemWidth] = useState('')
  const [itemHeight, setItemHeight] = useState('')
  const [itemPricePerSqM, setItemPricePerSqM] = useState('')
  
  // Add-ons
  const [addOns, setAddOns] = useState<AddOnItem[]>([])
  const [addOnName, setAddOnName] = useState('')
  const [addOnPrice, setAddOnPrice] = useState('')

  // Quotation ID
  const [quotationId, setQuotationId] = useState('')

  useEffect(() => {
    branchApi.getAll().then(res => {
      const data = res?.data || []
      setBranches(data)
      if (data.length > 0 && !selectedBranch) {
        setSelectedBranch(data[0])
      }
    })
    // Generate quotation ID
    const today = new Date()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    setQuotationId(`QT-${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}-${random}`)
  }, [])

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemName || !itemWidth || !itemHeight || !itemPricePerSqM) return
    
    const w = parseFloat(itemWidth) || 0
    const h = parseFloat(itemHeight) || 0
    const pps = parseFloat(itemPricePerSqM) || 0
    const area = w * h
    const total = area * pps
    
    setItems([...items, {
      id: items.length + 1,
      name: itemName,
      width: w,
      height: h,
      area,
      pricePerSqM: pps,
      total
    }])
    
    setItemName('')
    setItemWidth('')
    setItemHeight('')
    setItemPricePerSqM('')
  }

  const handleAddAddOn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!addOnName || !addOnPrice) return
    
    setAddOns([...addOns, {
      name: addOnName,
      price: parseFloat(addOnPrice) || 0
    }])
    
    setAddOnName('')
    setAddOnPrice('')
  }

  const removeItem = (id: number) => {
    setItems(items.filter(i => i.id !== id))
  }

  const removeAddOn = (index: number) => {
    setAddOns(addOns.filter((_, i) => i !== index))
  }

  const itemsTotal = items.reduce((sum, item) => sum + item.total, 0)
  const addOnsTotal = addOns.reduce((sum, addon) => sum + addon.price, 0)
  const grandTotal = itemsTotal + addOnsTotal

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: quotationId,
  })

  // Format date in Buddhist Era
  const formatDate = () => {
    const date = new Date()
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear() + 543
    return `${day}/${month}/${year}`
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title"><FileText size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} /> สร้างใบเสนอราคา</h1>
          <p className="page-subtitle">ออกใบเสนอราคาให้ลูกค้า พร้อมพิมพ์หรือบันทึก PDF</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Left Side: Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Branch Selection */}
          <div className="card">
            <h3 style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>ออกในนามสาขา</h3>
            <select 
              className="form-input" 
              value={selectedBranch?.id || ''} 
              onChange={e => setSelectedBranch(branches.find(b => b.id === e.target.value))}
            >
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Customer Info */}
          <div className="card">
            <h2 style={{ fontSize: 16, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
              <FileText size={18} /> ข้อมูลลูกค้า
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">ชื่อลูกค้า</label>
                <input 
                  className="form-input" 
                  value={custName} 
                  onChange={e => setCustName(e.target.value)} 
                  placeholder="ชื่อ นามสกุล / ชื่อบริษัท" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">เบอร์โทรศัพท์</label>
                <input 
                  className="form-input" 
                  value={custPhone} 
                  onChange={e => setCustPhone(e.target.value)} 
                  placeholder="08x-xxx-xxxx" 
                />
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
          </div>

          {/* Items Form */}
          <div className="card">
            <h2 style={{ fontSize: 16, marginBottom: 16 }}>เพิ่มรายการป้าย</h2>
            <form onSubmit={handleAddItem}>
              <div className="form-group">
                <label className="form-label">ชื่องาน / รายการ</label>
                <input 
                  className="form-input" 
                  value={itemName} 
                  onChange={e => setItemName(e.target.value)} 
                  placeholder="เช่น ไวนิลโปรโมชั่นหน้าร้าน"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
                <div className="form-group">
                  <label className="form-label">กว้าง (ม.)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    className="form-input" 
                    value={itemWidth} 
                    onChange={e => setItemWidth(e.target.value)} 
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ยาว (ม.)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    className="form-input" 
                    value={itemHeight} 
                    onChange={e => setItemHeight(e.target.value)} 
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ราคา/ตร.ม.</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    className="form-input" 
                    value={itemPricePerSqM} 
                    onChange={e => setItemPricePerSqM(e.target.value)} 
                    placeholder="0.00"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 12, width: '100%' }}>
                + เพิ่มรายการ
              </button>
            </form>

            {/* Items List */}
            {items.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>รายการที่เพิ่ม ({items.length})</h4>
                {items.map(item => (
                  <div key={item.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'var(--bg-box)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 8,
                    fontSize: 13
                  }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{item.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                        {item.width} x {item.height} m = {item.area.toFixed(2)} ตร.ม. @ {item.pricePerSqM.toLocaleString()}฿
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>{item.total.toLocaleString()}฿</span>
                      <button 
                        className="btn-icon delete" 
                        onClick={() => removeItem(item.id)}
                        style={{ padding: 4 }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add-ons Form */}
          <div className="card">
            <h2 style={{ fontSize: 16, marginBottom: 16 }}>ค่าใช้จ่ายเพิ่มเติม</h2>
            <form onSubmit={handleAddAddOn}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">รายการ</label>
                  <input 
                    className="form-input" 
                    value={addOnName} 
                    onChange={e => setAddOnName(e.target.value)} 
                    placeholder="เช่น ค่าติดตั้ง, ค่าโครง"
                    list="addon-suggestions"
                  />
                  <datalist id="addon-suggestions">
                    <option value="ค่าติดตั้ง" />
                    <option value="ค่าโครงเหล็ก" />
                    <option value="ค่าโครงไม้" />
                    <option value="ค่าขนส่ง" />
                  </datalist>
                </div>
                <div className="form-group" style={{ width: 120 }}>
                  <label className="form-label">ราคา</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    className="form-input" 
                    value={addOnPrice} 
                    onChange={e => setAddOnPrice(e.target.value)} 
                    placeholder="0.00"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-secondary" style={{ marginTop: 12, width: '100%' }}>
                + เพิ่มค่าใช้จ่าย
              </button>
            </form>

            {/* Add-ons List */}
            {addOns.length > 0 && (
              <div style={{ marginTop: 16 }}>
                {addOns.map((addon, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '6px 12px',
                    background: 'var(--bg-box)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 6,
                    fontSize: 13
                  }}>
                    <span>{addon.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{addon.price.toLocaleString()}฿</span>
                      <button 
                        className="btn-icon delete" 
                        onClick={() => removeAddOn(idx)}
                        style={{ padding: 4 }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Preview */}
        <div style={{ position: 'sticky', top: 20 }}>
          
          {/* Print Button */}
          <button 
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              padding: '14px', 
              fontSize: 16, 
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8
            }}
            onClick={handlePrint}
            disabled={items.length === 0 || !selectedBranch}
          >
            <Printer size={20} /> พิมพ์ / บันทึก PDF
          </button>

          {/* Preview Container */}
          <div 
            ref={printRef}
            className="quotation-preview"
            style={{
              background: 'white',
              padding: '40px',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              fontFamily: "'Sarabun', 'TH Sarabun New', sans-serif",
              color: '#333'
            }}
          >
            {/* Quotation Document */}
            <div style={{ maxWidth: '100%' }}>
              
              {/* Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: 24,
                paddingBottom: 16,
                borderBottom: '2px solid #2563eb'
              }}>
                <div>
                  {selectedBranch?.logo_url ? (
                    <img 
                      src={selectedBranch.logo_url} 
                      alt="logo" 
                      style={{ height: 60, marginBottom: 8 }}
                    />
                  ) : (
                    <div style={{ 
                      width: 60, 
                      height: 60, 
                      background: '#2563eb', 
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 24,
                      fontWeight: 'bold',
                      marginBottom: 8
                    }}>
                      {selectedBranch?.name?.[0] || 'Q'}
                    </div>
                  )}
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 'bold', color: '#1e40af' }}>
                    {selectedBranch?.name || 'ร้านป้ายไวนิล'}
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#666' }}>
                    {selectedBranch?.address || ''}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h1 style={{ 
                    margin: 0, 
                    fontSize: 24, 
                    fontWeight: 'bold', 
                    color: '#2563eb',
                    letterSpacing: '2px'
                  }}>
                    ใบเสนอราคา
                  </h1>
                  <p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#666' }}>
                    เลขที่: {quotationId}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#666' }}>
                    วันที่: {formatDate()}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div style={{ 
                background: '#f8fafc', 
                padding: 16, 
                borderRadius: 8,
                marginBottom: 24
              }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 'bold', color: '#374151' }}>
                  ข้อมูลลูกค้า
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
                  <div><strong>ชื่อลูกค้า:</strong> {custName || '-'}</div>
                  <div><strong>เบอร์โทร:</strong> {custPhone || '-'}</div>
                  <div><strong>ประเภท:</strong> {custType}</div>
                </div>
              </div>

              {/* Items Table */}
              {items.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 'bold', color: '#374151' }}>
                    รายการสินค้า
                  </h3>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse', 
                    fontSize: 12,
                    border: '1px solid #e5e7eb'
                  }}>
                    <thead>
                      <tr style={{ background: '#2563eb', color: 'white' }}>
                        <th style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid #1d4ed8' }}>#</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', border: '1px solid #1d4ed8' }}>รายการ</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right', border: '1px solid #1d4ed8' }}>กว้าง(ม.)</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right', border: '1px solid #1d4ed8' }}>ยาว(ม.)</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right', border: '1px solid #1d4ed8' }}>ตร.ม.</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right', border: '1px solid #1d4ed8' }}>ราคา/ตร.ม.</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right', border: '1px solid #1d4ed8' }}>รวม</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={item.id} style={{ background: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                          <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #e5e7eb' }}>{idx + 1}</td>
                          <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{item.name}</td>
                          <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #e5e7eb' }}>{item.width.toFixed(2)}</td>
                          <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #e5e7eb' }}>{item.height.toFixed(2)}</td>
                          <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #e5e7eb' }}>{item.area.toFixed(2)}</td>
                          <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #e5e7eb' }}>{item.pricePerSqM.toLocaleString()}</td>
                          <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #e5e7eb', fontWeight: 600 }}>{item.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add-ons */}
              {addOns.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 'bold', color: '#374151' }}>
                    ค่าใช้จ่ายเพิ่มเติม
                  </h3>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse', 
                    fontSize: 12,
                    border: '1px solid #e5e7eb'
                  }}>
                    <thead>
                      <tr style={{ background: '#64748b', color: 'white' }}>
                        <th style={{ padding: '10px 8px', textAlign: 'left', border: '1px solid #475569' }}>รายการ</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right', border: '1px solid #475569' }}>จำนวนเงิน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {addOns.map((addon, idx) => (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                          <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{addon.name}</td>
                          <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #e5e7eb', fontWeight: 600 }}>{addon.price.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totals */}
              <div style={{ 
                background: '#f0f9ff', 
                padding: 20, 
                borderRadius: 8,
                border: '2px solid #2563eb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                  <span>ราคาสินค้ารวม:</span>
                  <span>{itemsTotal.toLocaleString()} บาท</span>
                </div>
                {addOnsTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                    <span>ค่าใช้จ่ายเพิ่มเติม:</span>
                    <span>{addOnsTotal.toLocaleString()} บาท</span>
                  </div>
                )}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: '2px solid #2563eb',
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#1e40af'
                }}>
                  <span>ยอดรวมสุทธิ:</span>
                  <span>{grandTotal.toLocaleString()} บาท</span>
                </div>
              </div>

              {/* Footer */}
              <div style={{ 
                marginTop: 40,
                paddingTop: 16,
                borderTop: '1px solid #e5e7eb',
                fontSize: 12,
                color: '#666',
                textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 8px 0' }}>ขอบคุณที่ใช้บริการ</p>
                <p style={{ margin: 0, fontSize: 11 }}>
                  เอกสารนี้เป็นใบเสนอราคา มีอายุ 30 วันนับจากวันออกเอกสาร
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          
          body * {
            visibility: hidden;
          }
          
          .quotation-preview,
          .quotation-preview * {
            visibility: visible;
          }
          
          .quotation-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            padding: 0 !important;
          }
          
          button,
          .page-header,
          .card:not(.quotation-preview *),
          .btn {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { productApi, orderApi } from '../api/client'
import type { Product } from '../types'
import { ShoppingCart, Trash2, Search, ChefHat } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

interface CartItem {
  product: Product
  quantity: number
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(v)

export default function POSPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ทั้งหมด')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    productApi.getAll().then((r) => setProducts(r.data))
  }, [])

  const categories = ['ทั้งหมด', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))]

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'ทั้งหมด' || p.category === category
    return matchSearch && matchCat
  })

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id)
      if (existing) return prev.map((c) => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((c) => c.product.id === id ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c))
  }

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c.product.id !== id))
  }

  const total = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0)

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('กรุณาเลือกสินค้าก่อน'); return }
    setLoading(true)
    try {
      await orderApi.create({
        branch_id: user?.branch_id || '',
        note,
        items: cart.map((c) => ({ product_id: c.product.id, quantity: c.quantity, price: c.product.price })),
      })
      toast.success('✅ บันทึกออเดอร์สำเร็จ!')
      setCart([])
      setNote('')
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">POS ขายสินค้า</h1>
          <p className="page-subtitle">เลือกสินค้าและบันทึกออเดอร์</p>
        </div>
      </div>

      <div className="pos-grid">
        {/* Left: Products */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
          {/* Search + Filter */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div className="search-box">
              <Search size={16} color="var(--text-muted)" />
              <input placeholder="ค้นหาสินค้า..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {categories.map((c) => (
                <button
                  key={c}
                  className={`btn btn-sm ${category === c ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setCategory(c)}
                >{c}</button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="products-grid">
            {filtered.map((p) => (
              <div key={p.id} className="product-card" onClick={() => addToCart(p)}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <ChefHat size={20} color="var(--primary-light)" />
                </div>
                <div className="product-card-name">{p.name}</div>
                <div className="product-card-price">{formatCurrency(p.price)}</div>
                {p.category && <div className="product-card-category">{p.category}</div>}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                <ChefHat /><p>ไม่พบสินค้า</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart */}
        <div className="cart-panel">
          <div className="cart-header">
            <ShoppingCart size={18} style={{ display: 'inline', marginRight: 8 }} />
            ตะกร้า ({cart.reduce((s, c) => s + c.quantity, 0)} ชิ้น)
          </div>

          <div className="cart-items">
            {cart.length === 0 && (
              <div className="empty-state"><ShoppingCart /><p>ยังไม่มีสินค้าในตะกร้า</p></div>
            )}
            {cart.map((item) => (
              <div key={item.product.id} className="cart-item">
                <div style={{ flex: 1 }}>
                  <div className="cart-item-name">{item.product.name}</div>
                  <div className="cart-item-price">{formatCurrency(item.product.price)} × {item.quantity} = {formatCurrency(item.product.price * item.quantity)}</div>
                </div>
                <div className="cart-item-qty">
                  <button className="qty-btn" onClick={() => updateQty(item.product.id, -1)}>-</button>
                  <span style={{ fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQty(item.product.id, 1)}>+</button>
                  <button className="qty-btn" onClick={() => removeFromCart(item.product.id)} style={{ color: 'var(--danger)' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-footer">
            <div className="form-group" style={{ marginBottom: 12 }}>
              <input className="form-input" placeholder="หมายเหตุ (ไม่บังคับ)" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="cart-total">
              <span className="cart-total-label">ยอดรวม</span>
              <span className="cart-total-value">{formatCurrency(total)}</span>
            </div>
            <button
              className="btn btn-success btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
            >
              {loading ? <div className="spinner" /> : '✅ ยืนยันออเดอร์'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

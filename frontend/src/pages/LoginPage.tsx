import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Printer } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px 44px',
        width: '420px',
        maxWidth: '90vw',
        boxShadow: '0 20px 60px -12px rgb(0 0 0 / 0.12), 0 8px 16px -8px rgb(0 0 0 / 0.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 60,
            height: 60,
            borderRadius: 16,
            background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)',
            color: 'white',
            marginBottom: 16,
            boxShadow: '0 8px 24px -4px rgba(99, 102, 241, 0.4)',
          }}>
            <Printer size={28} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>งานอิงค์เจ็ท</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>ระบบจัดการร้านป้าย</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'center' }}>
            <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>อีเมล</label>
            <input
              id="login-email"
              className="form-input"
              style={{ textAlign: 'center' }}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              autoFocus
            />
          </div>
          <div className="form-group" style={{ textAlign: 'center' }}>
            <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>รหัสผ่าน</label>
            <input
              id="login-password"
              className="form-input"
              style={{ textAlign: 'center' }}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              background: '#fef2f2',
              color: 'var(--danger)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              marginBottom: 16,
              border: '1px solid #fecaca',
            }}>
              {error}
            </div>
          )}

          <button
            id="login-submit"
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: '100%', marginTop: 8, padding: '12px 0', fontSize: 14, justifyContent: 'center' }}
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  )
}

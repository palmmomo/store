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
      background: '#f8fafc',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '32px 40px',
        width: '400px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'var(--primary)',
            color: 'white',
            marginBottom: 16,
          }}>
            <Printer size={28} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>งานอิงค์เจ็ท</h1>
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
              padding: '8px 12px',
              background: 'var(--danger-bg, #fef2f2)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button
            id="login-submit"
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: '100%', marginTop: 8, padding: '10px 0', fontSize: 14, justifyContent: 'center' }}
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

      </div>
    </div>
  )
}

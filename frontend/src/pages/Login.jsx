import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ShieldIcon = () => (
  <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
)

const LockIcon = () => (
  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
)

const EyeIcon = ({ open }) => open ? (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
) : (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
)

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.errors?.email ||
        'Login failed. Please check your credentials.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--bg-primary)' }}>
      {/* Background grid pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(var(--text-primary) 1px,transparent 1px),linear-gradient(90deg,var(--text-primary) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Subtle glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: '0 0 32px rgba(59,130,246,0.15)' }}>
            <ShieldIcon />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">CyberGuard</h1>
          <p className="mt-1.5 text-sm text-slate-500">Sign in to your security dashboard</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold text-slate-100 mb-1">Welcome back</h2>
          <p className="text-xs text-slate-500 mb-6">Enter your credentials to access your account</p>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 px-4 py-3 rounded-lg text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-400 uppercase tracking-wider">
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-lg text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.5)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border-color)')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border-color)')}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all mt-2 flex items-center justify-center gap-2"
              style={{ background: loading ? 'var(--text-muted)' : 'var(--accent)', cursor: loading ? 'not-allowed' : 'pointer' }}
              onMouseEnter={e => { if (!loading) e.target.style.background = 'var(--accent-hover)' }}
              onMouseLeave={e => { if (!loading) e.target.style.background = 'var(--accent)' }}
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Security note */}
          <div className="mt-5 pt-4 border-t border-[var(--border-color)] flex items-center gap-2">
            <LockIcon />
            <p className="text-[11px] text-slate-600">Protected with JWT authentication & bcrypt password hashing</p>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  )
}

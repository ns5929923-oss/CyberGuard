import { useState } from 'react'
import { DashboardLayout } from './Dashboard'
import api from '../api/client'

// ── Icons ─────────────────────────────────────────────────────────────────────
const ScanIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)

const XIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
)

// ── Severity helpers ──────────────────────────────────────────────────────────
const SEVERITY = {
  critical:      { label: 'Critical',      bg: 'bg-red-600/15',    text: 'text-red-400',    border: 'border-red-600/25' },
  high:          { label: 'High',          bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  medium:        { label: 'Medium',        bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/20' },
  low:           { label: 'Low',           bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20' },
  informational: { label: 'Info',          bg: 'bg-slate-500/10',  text: 'text-slate-400',  border: 'border-slate-500/20' },
  info:          { label: 'Info',          bg: 'bg-slate-500/10',  text: 'text-slate-400',  border: 'border-slate-500/20' },
}

function SeverityBadge({ severity }) {
  const s = SEVERITY[severity] || SEVERITY.info
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text} border ${s.border}`}>
      {s.label}
    </span>
  )
}

// ── Finding card ──────────────────────────────────────────────────────────────
function FindingCard({ finding }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
      <button
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <SeverityBadge severity={finding.severity} />
        <span className="flex-1 text-sm text-slate-200 font-medium leading-snug">{finding.title}</span>
        <svg
          className={`w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-[var(--border-color)]">
          <p className="text-sm text-slate-400 pt-3">{finding.description}</p>
          {finding.recommendation && (
            <div className="rounded bg-blue-500/5 border border-blue-500/15 px-3 py-2">
              <p className="text-xs text-blue-400 font-medium mb-0.5">Recommendation</p>
              <p className="text-xs text-slate-300">{finding.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Header check row ──────────────────────────────────────────────────────────
function HeaderRow({ check }) {
  const present = check.present
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--border-color)] last:border-0">
      <span className={`flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0 ${present ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
        {present ? <CheckIcon /> : <XIcon />}
      </span>
      <span className="flex-1 text-sm font-mono text-slate-300">{check.header}</span>
      {present && check.value && (
        <span className="text-xs text-slate-500 truncate max-w-[200px]" title={check.value}>
          {check.value.length > 40 ? check.value.slice(0, 40) + '…' : check.value}
        </span>
      )}
      {!present && <span className="text-xs text-red-400">Missing</span>}
    </div>
  )
}

// ── Progress step component ───────────────────────────────────────────────────
const PROGRESS_STEPS = [
  { key: 'https',    label: 'Checking HTTPS…' },
  { key: 'headers',  label: 'Checking security headers…' },
  { key: 'cookies',  label: 'Checking cookies…' },
  { key: 'analysis', label: 'Analyzing results…' },
]

function ProgressIndicator({ step }) {
  return (
    <div className="flex flex-col gap-2 py-6">
      {PROGRESS_STEPS.map((s, i) => {
        const idx = PROGRESS_STEPS.findIndex(p => p.key === step)
        const done = i < idx
        const active = s.key === step
        return (
          <div key={s.key} className={`flex items-center gap-3 text-sm transition-opacity ${active ? 'opacity-100' : done ? 'opacity-40' : 'opacity-20'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border ${
              done   ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' :
              active ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' :
                       'border-slate-600 text-slate-600'
            }`}>
              {done ? <CheckIcon /> : active ? (
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse block" />
              ) : <span className="w-2 h-2 rounded-full bg-slate-600 block" />}
            </span>
            <span className={done ? 'text-slate-400' : active ? 'text-slate-200' : 'text-slate-600'}>
              {s.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main Scanner page ─────────────────────────────────────────────────────────
export default function Scanner() {
  const [url, setUrl] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [progressStep, setProgressStep] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [fieldError, setFieldError] = useState(null)

  const canScan = url.trim() !== '' && authorized && !scanning

  async function handleScan(e) {
    e.preventDefault()
    setFieldError(null)
    setError(null)
    setResult(null)

    const target = url.trim()
    if (!target) { setFieldError('Please enter a URL.'); return }
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      setFieldError('URL must start with http:// or https://')
      return
    }

    setScanning(true)
    setProgressStep('https')

    // Animate progress steps while the request is in flight
    const delays = { https: 600, headers: 1200, cookies: 1900, analysis: 2500 }
    const stepKeys = ['https', 'headers', 'cookies', 'analysis']
    stepKeys.forEach(key => {
      setTimeout(() => {
        setProgressStep(prev => {
          // Only advance if we're still scanning
          return prev ? key : prev
        })
      }, delays[key])
    })

    try {
      const res = await api.post('/scans', {
        target,
        authorization_confirmed: true,
      })
      setResult(res.data)
    } catch (err) {
      const data = err.response?.data
      if (data?.errors?.target) {
        setFieldError(data.errors.target)
      } else if (data?.error) {
        setError(data.error)
      } else if (data?.status === 'error' && data?.error) {
        setError(data.error)
      } else {
        setError('Scan failed. Please check the URL and try again.')
      }
    } finally {
      setScanning(false)
      setProgressStep(null)
    }
  }

  // ── Derived data from result ───────────────────────────────────────────────
  const headerChecks = result?.checks?.filter(c => c.header) ?? []
  const httpsCheck   = result?.checks?.find(c => c.name === 'https')
  const cookieCheck  = result?.checks?.find(c => c.name === 'cookies')
  const findings     = result?.findings ?? []
  const findingsBySeverity = {
    critical:      findings.filter(f => f.severity === 'critical'),
    high:          findings.filter(f => f.severity === 'high'),
    medium:        findings.filter(f => f.severity === 'medium'),
    low:           findings.filter(f => f.severity === 'low'),
    informational: findings.filter(f => f.severity === 'informational' || f.severity === 'info'),
  }

  return (
    <DashboardLayout title="Security Scanner">
      <div className="max-w-3xl space-y-6">

        {/* ── Scan form ── */}
        <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400">
              <ShieldIcon />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Website Security Scanner</h2>
              <p className="text-xs text-slate-500">Passive, non-destructive security checks</p>
            </div>
          </div>

          <form onSubmit={handleScan} className="space-y-4">
            {/* URL input */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Target URL</label>
              <input
                type="url"
                value={url}
                onChange={e => { setUrl(e.target.value); setFieldError(null) }}
                placeholder="https://example.com"
                disabled={scanning}
                className={`w-full px-3 py-2.5 rounded-lg bg-[var(--bg-primary)] border text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors disabled:opacity-50 ${fieldError ? 'border-red-500/50' : 'border-[var(--border-color)]'}`}
              />
              {fieldError && (
                <p className="mt-1.5 text-xs text-red-400">{fieldError}</p>
              )}
            </div>

            {/* Authorization checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={authorized}
                  onChange={e => setAuthorized(e.target.checked)}
                  disabled={scanning}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${authorized ? 'bg-blue-500 border-blue-500' : 'bg-transparent border-slate-600 group-hover:border-slate-400'}`}>
                  {authorized && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs text-slate-400 leading-snug">
                I confirm that I own or have explicit permission to assess this target.
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canScan}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors"
            >
              <ScanIcon />
              {scanning ? 'Scanning…' : 'Start Scan'}
            </button>
          </form>
        </div>

        {/* ── Progress ── */}
        {scanning && progressStep && (
          <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] px-5">
            <p className="pt-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Scan in progress</p>
            <ProgressIndicator step={progressStep} />
          </div>
        )}

        {/* ── Error state ── */}
        {error && !scanning && (
          <div className="rounded-xl bg-red-500/5 border border-red-500/20 px-5 py-4">
            <p className="text-sm font-medium text-red-400 mb-1">Scan failed</p>
            <p className="text-sm text-slate-400">{error}</p>
          </div>
        )}

        {/* ── Results ── */}
        {result && !scanning && (
          <div className="space-y-4">

            {/* Summary bar */}
            <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Scan target</p>
                  <p className="text-sm font-medium text-slate-200 break-all">{result.target}</p>
                </div>
                <div className="flex items-center gap-2">
                  {findings.length === 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <CheckIcon /> No issues found
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      {findings.length} finding{findings.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* HTTP info */}
              {result.http_info && (
                <div className="mt-4 pt-4 border-t border-[var(--border-color)] grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Status', value: result.http_info.status_code },
                    { label: 'Response time', value: result.http_info.response_time_ms ? `${result.http_info.response_time_ms} ms` : '—' },
                    { label: 'Content type', value: result.http_info.content_type || '—' },
                    { label: 'Server', value: result.http_info.server || 'Not disclosed' },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-xs text-slate-500 mb-0.5">{item.label}</p>
                      <p className="text-sm font-medium text-slate-300 truncate">{item.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* HTTPS / TLS */}
            {httpsCheck && (
              <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[var(--border-color)]">
                  <h3 className="text-sm font-medium text-slate-200">HTTPS &amp; TLS</h3>
                </div>
                <div className="px-5 py-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0 ${httpsCheck.present ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                      {httpsCheck.present ? <CheckIcon /> : <XIcon />}
                    </span>
                    <span className="text-sm text-slate-300">HTTPS enabled</span>
                  </div>
                  {httpsCheck.present && (
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0 ${httpsCheck.reachable ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                        {httpsCheck.reachable ? <CheckIcon /> : <XIcon />}
                      </span>
                      <span className="text-sm text-slate-300">TLS connection reachable</span>
                    </div>
                  )}
                  {httpsCheck.cert_info && (
                    <div className="mt-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {[
                        { label: 'TLS version', value: httpsCheck.cert_info.tls_version },
                        { label: 'Cipher', value: httpsCheck.cert_info.cipher },
                        { label: 'Certificate expires', value: httpsCheck.cert_info.not_after },
                        { label: 'Issuer', value: httpsCheck.cert_info.issuer },
                      ].map(row => row.value && (
                        <div key={row.label}>
                          <span className="text-slate-500">{row.label}: </span>
                          <span className="text-slate-300">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {httpsCheck.error && (
                    <p className="text-xs text-red-400 mt-1">{httpsCheck.error}</p>
                  )}
                </div>
              </div>
            )}

            {/* Security headers */}
            {headerChecks.length > 0 && (
              <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[var(--border-color)] flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-200">Security Headers</h3>
                  <span className="text-xs text-slate-500">
                    {headerChecks.filter(c => c.present).length}/{headerChecks.length} present
                  </span>
                </div>
                <div className="px-5 divide-y divide-[var(--border-color)]">
                  {headerChecks.map(c => <HeaderRow key={c.header} check={c} />)}
                </div>
              </div>
            )}

            {/* Cookies */}
            {cookieCheck && (
              <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[var(--border-color)]">
                  <h3 className="text-sm font-medium text-slate-200">Cookies</h3>
                </div>
                <div className="px-5 py-4">
                  {cookieCheck.cookies_found === 0 ? (
                    <p className="text-sm text-slate-500">No cookies set in this response.</p>
                  ) : (
                    <div className="space-y-2">
                      {cookieCheck.cookies.map(cookie => (
                        <div key={cookie.name} className="rounded-lg border border-[var(--border-color)] px-4 py-3">
                          <p className="text-xs font-mono font-medium text-slate-300 mb-2">{cookie.name}</p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: 'Secure',   ok: cookie.secure },
                              { label: 'HttpOnly', ok: cookie.httponly },
                              { label: `SameSite${cookie.samesite ? ': ' + cookie.samesite : ''}`, ok: !!cookie.samesite },
                            ].map(attr => (
                              <span key={attr.label} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${attr.ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {attr.ok ? <CheckIcon /> : <XIcon />} {attr.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Findings */}
            {findings.length > 0 && (
              <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[var(--border-color)] flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-200">Findings</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['critical', 'high', 'medium', 'low'].map(sev => {
                      const count = findingsBySeverity[sev]?.length
                      if (!count) return null
                      const s = SEVERITY[sev]
                      return (
                        <span key={sev} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text} border ${s.border}`}>
                          {count} {s.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {['critical', 'high', 'medium', 'low', 'informational'].flatMap(sev =>
                    (findingsBySeverity[sev] || []).map(f => <FindingCard key={f.id} finding={f} />)
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

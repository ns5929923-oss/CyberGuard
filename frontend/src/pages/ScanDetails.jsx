import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { DashboardLayout } from './Dashboard'
import api from '../api/client'

// ── Helpers ───────────────────────────────────────────────────────────────────
const RISK = {
  LOW:      { label: 'Low',      bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', bar: 'bg-emerald-500' },
  MODERATE: { label: 'Moderate', bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20',  bar: 'bg-amber-500' },
  HIGH:     { label: 'High',     bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/20', bar: 'bg-orange-500' },
  CRITICAL: { label: 'Critical', bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20',    bar: 'bg-red-500' },
}

const SEVERITY = {
  critical:     { label: 'Critical',     bg: 'bg-red-500/10',     text: 'text-red-400',    border: 'border-red-500/20',    order: 0 },
  high:         { label: 'High',         bg: 'bg-orange-500/10',  text: 'text-orange-400', border: 'border-orange-500/20', order: 1 },
  medium:       { label: 'Medium',       bg: 'bg-amber-500/10',   text: 'text-amber-400',  border: 'border-amber-500/20',  order: 2 },
  low:          { label: 'Low',          bg: 'bg-blue-500/10',    text: 'text-blue-400',   border: 'border-blue-500/20',   order: 3 },
  informational:{ label: 'Info',         bg: 'bg-slate-500/10',   text: 'text-slate-400',  border: 'border-slate-500/20',  order: 4 },
}

function SeverityBadge({ severity }) {
  const s = SEVERITY[severity] || SEVERITY.informational
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text} border ${s.border}`}>
      {s.label}
    </span>
  )
}

function RiskBadge({ level }) {
  const r = RISK[level] || { label: level || '—', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${r.bg} ${r.text} border ${r.border}`}>
      {r.label} Risk
    </span>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const BackIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
)
const ChevronIcon = ({ open }) => (
  <svg className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

// ── Score gauge ───────────────────────────────────────────────────────────────
function ScoreGauge({ score, riskLevel }) {
  if (score === null || score === undefined) return null
  const r = RISK[riskLevel] || RISK.CRITICAL
  const pct = Math.max(0, Math.min(100, score))
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <span className={`text-5xl font-bold tabular-nums ${r.text}`}>{score}</span>
      <span className="text-xs text-slate-500">out of 100</span>
      <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${r.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <RiskBadge level={riskLevel} />
    </div>
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
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-200 font-medium leading-snug">{finding.title}</p>
          {finding.category && (
            <p className="text-xs text-slate-500 mt-0.5">{finding.category}</p>
          )}
        </div>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-[var(--border-color)]">
          {finding.description && (
            <p className="text-sm text-slate-400 pt-3">{finding.description}</p>
          )}
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

// ── Main ScanDetails page ─────────────────────────────────────────────────────
export default function ScanDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [scan, setScan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.get(`/scans/${id}`)
      .then(res => setScan(res.data))
      .catch(err => {
        if (err.response?.status === 404) {
          setError('Scan not found.')
        } else {
          setError('Failed to load scan details.')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const findings = scan?.findings || []
  const sortedFindings = [...findings].sort((a, b) => {
    const ao = (SEVERITY[a.severity] || SEVERITY.informational).order
    const bo = (SEVERITY[b.severity] || SEVERITY.informational).order
    return ao - bo
  })

  const severityCounts = findings.reduce((acc, f) => {
    const sev = f.severity || 'informational'
    acc[sev] = (acc[sev] || 0) + 1
    return acc
  }, {})

  return (
    <DashboardLayout title="Scan Details">
      <div className="max-w-3xl space-y-5">

        {/* Back button */}
        <Link
          to="/history"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <BackIcon /> Back to Scan History
        </Link>

        {loading && (
          <div className="flex items-center justify-center py-24 text-slate-500 text-sm gap-2">
            <span className="w-4 h-4 border-2 border-blue-500/40 border-t-blue-400 rounded-full animate-spin" />
            Loading scan details…
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => navigate('/history')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors"
            >
              ← Return to History
            </button>
          </div>
        )}

        {scan && !loading && (
          <>
            {/* Overview card */}
            <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border-color)]">
                <h2 className="text-sm font-medium text-slate-200">Scan Overview</h2>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Left: meta */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Target</p>
                    <p className="text-sm font-medium text-slate-200 break-all">{scan.target}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Scan date</p>
                    <p className="text-sm text-slate-300">{formatDate(scan.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Status</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      scan.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {scan.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Findings</p>
                    <div className="flex flex-wrap gap-1.5">
                      {findings.length === 0 ? (
                        <span className="text-sm text-slate-400">No findings</span>
                      ) : (
                        ['critical', 'high', 'medium', 'low', 'informational'].map(sev => {
                          const count = severityCounts[sev]
                          if (!count) return null
                          const s = SEVERITY[sev]
                          return (
                            <span key={sev} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text} border ${s.border}`}>
                              {count} {s.label}
                            </span>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>
                {/* Right: score gauge */}
                <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]/30 px-4 py-2">
                  <ScoreGauge score={scan.score} riskLevel={scan.risk_level} />
                </div>
              </div>
            </div>

            {/* Findings */}
            <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[var(--border-color)] flex items-center justify-between">
                <h2 className="text-sm font-medium text-slate-200">Findings</h2>
                <span className="text-xs text-slate-500">{findings.length} total</span>
              </div>
              <div className="p-4 space-y-2">
                {sortedFindings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-300">No issues found</p>
                    <p className="text-xs text-slate-500">All security checks passed for this target.</p>
                  </div>
                ) : (
                  sortedFindings.map(f => <FindingCard key={f.id} finding={f} />)
                )}
              </div>
            </div>

            {/* Recommendations summary (only if findings exist) */}
            {sortedFindings.filter(f => f.recommendation).length > 0 && (
              <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[var(--border-color)]">
                  <h2 className="text-sm font-medium text-slate-200">Recommendations</h2>
                </div>
                <ul className="divide-y divide-[var(--border-color)]">
                  {sortedFindings
                    .filter(f => f.recommendation)
                    .map(f => (
                      <li key={f.id} className="px-5 py-3 flex items-start gap-3">
                        <SeverityBadge severity={f.severity} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-300 mb-0.5 truncate">{f.title}</p>
                          <p className="text-xs text-slate-400">{f.recommendation}</p>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

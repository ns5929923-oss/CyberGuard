import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import StatCard from '../components/StatCard'
import SecurityScore from '../components/SecurityScore'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import api from '../api/client'

// ── Risk helpers (for recent scans table) ─────────────────────────────────────
const RISK = {
  LOW:      { label: 'Low',      bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  MODERATE: { label: 'Moderate', bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
  HIGH:     { label: 'High',     bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/20' },
  CRITICAL: { label: 'Critical', bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20' },
}

function RiskBadge({ level }) {
  const r = RISK[level] || { label: level || '—', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${r.bg} ${r.text} border ${r.border}`}>
      {r.label}
    </span>
  )
}

function ScorePill({ score }) {
  if (score === null || score === undefined) return <span className="text-slate-500 text-sm">—</span>
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : score >= 40 ? 'text-orange-400' : 'text-red-400'
  return <span className={`text-sm font-semibold tabular-nums ${color}`}>{score}</span>
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Icons ────────────────────────────────────────────────────────────────────
const ShieldIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
)
const ScanIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
)
const FindingsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
)
const DangerIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
  </svg>
)

// ── Layout wrapper used by all dashboard pages ────────────────────────────────
export function DashboardLayout({ title, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">
        <Navbar title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

// ── Dashboard page ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  function fetchStats() {
    setLoading(true)
    setError(null)
    api
      .get('/dashboard')
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const noData = stats?.total_scans === 0

  return (
    <DashboardLayout title="Dashboard">
      {loading ? (
        <LoadingSpinner message="Loading dashboard…" />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchStats} />
      ) : (
        <div className="space-y-6 max-w-6xl">
          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Security Score"
              value={stats.latest_score !== null ? `${stats.latest_score}` : null}
              sub="out of 100"
              icon={<ShieldIcon />}
              accent="blue"
              isEmpty={noData}
            />
            <StatCard
              label="Total Scans"
              value={stats.total_scans}
              sub="all time"
              icon={<ScanIcon />}
              accent="green"
              isEmpty={noData}
            />
            <StatCard
              label="Total Findings"
              value={stats.total_findings}
              sub="across all scans"
              icon={<FindingsIcon />}
              accent="yellow"
              isEmpty={noData}
            />
            <StatCard
              label="High Risk Findings"
              value={stats.high_risk_findings}
              sub="require attention"
              icon={<DangerIcon />}
              accent="red"
              isEmpty={noData}
            />
          </div>

          {/* Score + Recent Scans row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Security Score gauge */}
            <SecurityScore score={stats.latest_score} />

            {/* Recent Scans */}
            <div className="lg:col-span-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
                <h2 className="text-sm font-medium text-slate-200">Recent Scans</h2>
                {!noData && (
                  <Link to="/history" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    View all →
                  </Link>
                )}
              </div>
              {noData ? (
                <EmptyState
                  title="No scans yet"
                  message="Run your first security scan to see results here."
                />
              ) : (
                <div className="divide-y divide-[var(--border-color)]">
                  {(stats.recent_scans || []).map(scan => (
                    <Link
                      key={scan.id}
                      to={`/history/${scan.id}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 truncate group-hover:text-blue-400 transition-colors">
                          {scan.target}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(scan.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <ScorePill score={scan.score} />
                        <RiskBadge level={scan.risk_level} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

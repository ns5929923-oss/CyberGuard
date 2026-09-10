import { useEffect, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { DashboardLayout } from './Dashboard'
import api from '../api/client'

// ── Risk level helpers ────────────────────────────────────────────────────────
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
  if (score === null || score === undefined) return <span className="text-slate-500">—</span>
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : score >= 40 ? 'text-orange-400' : 'text-red-400'
  return <span className={`font-semibold tabular-nums ${color}`}>{score}</span>
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
)
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
)
const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const SortIcon = ({ dir }) => (
  <svg className="w-3.5 h-3.5 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    {dir === 'asc'
      ? <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      : <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />}
  </svg>
)

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Main History page ─────────────────────────────────────────────────────────
export default function History() {
  const navigate = useNavigate()
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  function fetchScans() {
    setLoading(true)
    setError(null)
    api.get('/scans')
      .then(res => setScans(res.data))
      .catch(() => setError('Failed to load scan history.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchScans() }, [])

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this scan record? This cannot be undone.')) return
    setDeletingId(id)
    setDeleteError(null)
    try {
      await api.delete(`/scans/${id}`)
      setScans(prev => prev.filter(s => s.id !== id))
    } catch {
      setDeleteError('Failed to delete scan. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return scans.filter(s =>
      !q ||
      s.target.toLowerCase().includes(q) ||
      (s.risk_level || '').toLowerCase().includes(q)
    )
  }, [scans, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey]
      if (sortKey === 'created_at') {
        av = new Date(av).getTime()
        bv = new Date(bv).getTime()
      }
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortKey, sortDir])

  const ColHeader = ({ label, sKey }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-200 transition-colors whitespace-nowrap"
      onClick={() => handleSort(sKey)}
    >
      {label}
      {sortKey === sKey && <SortIcon dir={sortDir} />}
    </th>
  )

  return (
    <DashboardLayout title="Scan History">
      <div className="max-w-6xl space-y-4">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-500 pointer-events-none">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by target or risk level…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
            />
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {sorted.length} {sorted.length === 1 ? 'scan' : 'scans'}
          </span>
        </div>

        {deleteError && (
          <div className="rounded-lg bg-red-500/5 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {deleteError}
          </div>
        )}

        {/* Table card */}
        <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500 text-sm gap-2">
              <span className="w-4 h-4 border-2 border-blue-500/40 border-t-blue-400 rounded-full animate-spin" />
              Loading scans…
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={fetchScans}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-500/10 border border-slate-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {scans.length === 0 ? (
                <>
                  <p className="text-sm font-medium text-slate-300">No scans yet</p>
                  <p className="text-xs text-slate-500">Run a scan from the Security Scanner to see results here.</p>
                  <Link
                    to="/scanner"
                    className="mt-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors"
                  >
                    Go to Scanner →
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-300">No results for "{search}"</p>
                  <button onClick={() => setSearch('')} className="text-xs text-blue-400 hover:text-blue-300">
                    Clear search
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[var(--border-color)] bg-[var(--bg-primary)]/40">
                  <tr>
                    <ColHeader label="Target" sKey="target" />
                    <ColHeader label="Date" sKey="created_at" />
                    <ColHeader label="Score" sKey="score" />
                    <ColHeader label="Risk" sKey="risk_level" />
                    <ColHeader label="Findings" sKey="findings_count" />
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {sorted.map(scan => (
                    <tr
                      key={scan.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-4 py-3 max-w-xs">
                        <span
                          className="text-sm text-slate-200 truncate block cursor-pointer hover:text-blue-400 transition-colors"
                          title={scan.target}
                          onClick={() => navigate(`/history/${scan.id}`)}
                        >
                          {scan.target}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap">
                        {formatDate(scan.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <ScorePill score={scan.score} />
                      </td>
                      <td className="px-4 py-3">
                        <RiskBadge level={scan.risk_level} />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400 tabular-nums">
                        {scan.findings_count}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          scan.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          {scan.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/history/${scan.id}`}
                            className="flex items-center justify-center w-7 h-7 rounded text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            title="View details"
                          >
                            <EyeIcon />
                          </Link>
                          <button
                            onClick={() => handleDelete(scan.id)}
                            disabled={deletingId === scan.id}
                            className="flex items-center justify-center w-7 h-7 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                            title="Delete scan"
                          >
                            {deletingId === scan.id
                              ? <span className="w-3.5 h-3.5 border-2 border-red-500/40 border-t-red-400 rounded-full animate-spin" />
                              : <TrashIcon />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

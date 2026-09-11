import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '../components/AdminLayout'
import { fetchAdminScans } from '../services/adminService'

const RISK_BADGE = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/25',
  high:     'bg-orange-500/15 text-orange-400 border-orange-500/25',
  medium:   'bg-amber-500/15 text-amber-400 border-amber-500/25',
  low:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminScans() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [riskFilter, setRiskFilter] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [page, setPage] = useState(1)

  const loadScans = useCallback(() => {
    setLoading(true)
    const params = { page, per_page: 20 }
    if (riskFilter) params.risk_level = riskFilter

    fetchAdminScans(params)
      .then(setData)
      .catch(() => setError('Failed to load scans.'))
      .finally(() => setLoading(false))
  }, [page, riskFilter])

  useEffect(() => { loadScans() }, [loadScans])

  const filtered = data?.scans?.filter(s => {
    if (!userSearch) return true
    const q = userSearch.toLowerCase()
    return s.user_name?.toLowerCase().includes(q) || s.user_email?.toLowerCase().includes(q)
  }) ?? []

  return (
    <AdminLayout title="All Scans">
      <div className="space-y-4">
        {/* Filters */}
        <div className="rounded-xl p-4 bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Filter by User</label>
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Name or email…"
                className="w-full px-3 py-2 rounded-lg text-sm text-slate-200 placeholder-slate-600 outline-none"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Risk Level</label>
              <select
                value={riskFilter}
                onChange={e => { setRiskFilter(e.target.value); setPage(1) }}
                className="px-3 py-2 rounded-lg text-sm text-slate-200 outline-none"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
              >
                <option value="">All levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            {error}
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border-color)]">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {data ? `${data.total} scan${data.total !== 1 ? 's' : ''}` : 'Scans'}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  {['ID', 'User', 'Target', 'Scan Date', 'Risk Score', 'Risk Level', 'Findings'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">Loading…</td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">No scans found.</td></tr>
                )}
                {!loading && filtered.map(s => (
                  <tr key={s.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-slate-400">#{s.id}</td>
                    <td className="px-5 py-3">
                      <p className="text-slate-200 font-medium">{s.user_name}</p>
                      <p className="text-[11px] text-slate-500">{s.user_email}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-300 max-w-xs truncate">{s.target}</td>
                    <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{fmtDate(s.created_at)}</td>
                    <td className="px-5 py-3 text-slate-300 font-mono">{s.score ?? '—'}</td>
                    <td className="px-5 py-3">
                      {s.risk_level ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${RISK_BADGE[s.risk_level] || 'text-slate-400 border-slate-500/20'}`}>
                          {s.risk_level}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-400">{s.findings_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="px-5 py-3 border-t border-[var(--border-color)] flex items-center justify-between">
              <span className="text-xs text-slate-500">Page {data.page} of {data.pages}</span>
              <div className="flex gap-2">
                <button disabled={data.page <= 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 rounded text-xs font-medium text-slate-400 hover:text-slate-200 disabled:opacity-40 border border-[var(--border-color)] transition-colors">
                  Previous
                </button>
                <button disabled={data.page >= data.pages} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 rounded text-xs font-medium text-slate-400 hover:text-slate-200 disabled:opacity-40 border border-[var(--border-color)] transition-colors">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

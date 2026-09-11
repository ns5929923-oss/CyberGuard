import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '../components/AdminLayout'
import { fetchAdminFindings } from '../services/adminService'

const SEV_BADGE = {
  critical:      'bg-red-500/15 text-red-400 border-red-500/25',
  high:          'bg-orange-500/15 text-orange-400 border-orange-500/25',
  medium:        'bg-amber-500/15 text-amber-400 border-amber-500/25',
  low:           'bg-blue-500/15 text-blue-400 border-blue-500/25',
  informational: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminFindings() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [severityFilter, setSeverityFilter] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [page, setPage] = useState(1)

  const loadFindings = useCallback(() => {
    setLoading(true)
    const params = { page, per_page: 20 }
    if (severityFilter) params.severity = severityFilter

    fetchAdminFindings(params)
      .then(setData)
      .catch(() => setError('Failed to load findings.'))
      .finally(() => setLoading(false))
  }, [page, severityFilter])

  useEffect(() => { loadFindings() }, [loadFindings])

  const filtered = data?.findings?.filter(f => {
    if (!userSearch) return true
    const q = userSearch.toLowerCase()
    return f.user_name?.toLowerCase().includes(q) || f.user_email?.toLowerCase().includes(q)
  }) ?? []

  return (
    <AdminLayout title="All Findings">
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
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Severity</label>
              <select
                value={severityFilter}
                onChange={e => { setSeverityFilter(e.target.value); setPage(1) }}
                className="px-3 py-2 rounded-lg text-sm text-slate-200 outline-none"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
              >
                <option value="">All severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="informational">Informational</option>
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
              {data ? `${data.total} finding${data.total !== 1 ? 's' : ''}` : 'Findings'}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  {['ID', 'Scan ID', 'User', 'Target', 'Finding', 'Severity', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-500">Loading…</td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-500">No findings found.</td></tr>
                )}
                {!loading && filtered.map(f => (
                  <tr key={f.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-slate-400">#{f.id}</td>
                    <td className="px-5 py-3 text-slate-400">#{f.scan_id}</td>
                    <td className="px-5 py-3">
                      <p className="text-slate-200 font-medium">{f.user_name}</p>
                      <p className="text-[11px] text-slate-500">{f.user_email}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-300 max-w-xs truncate">{f.target || '—'}</td>
                    <td className="px-5 py-3 text-slate-200 max-w-xs">
                      <p className="font-medium truncate">{f.title}</p>
                      {f.category && <p className="text-[11px] text-slate-500">{f.category}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${SEV_BADGE[f.severity] || SEV_BADGE.informational}`}>
                        {f.severity}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 capitalize">{f.status}</td>
                    <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{fmtDate(f.scan_created_at)}</td>
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

import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import ConfirmModal from '../components/ConfirmModal'
import { fetchAdminUsers, setUserStatus, deleteAdminUser } from '../services/adminService'
import { useAuth } from '../context/AuthContext'

const ROLE_BADGE = {
  admin: 'bg-purple-500/15 text-purple-400 border border-purple-500/25',
  user:  'bg-blue-500/15 text-blue-400 border border-blue-500/25',
}

const STATUS_BADGE = {
  true:  'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  false: 'bg-red-500/15 text-red-400 border border-red-500/25',
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function AdminUsers() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [order, setOrder] = useState('desc')
  const [page, setPage] = useState(1)

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, action: null, user: null })

  const loadUsers = useCallback(() => {
    setLoading(true)
    const params = { page, per_page: 20, sort_by: sortBy, order }
    if (search) params.search = search
    if (roleFilter) params.role = roleFilter
    if (statusFilter !== '') params.is_active = statusFilter

    fetchAdminUsers(params)
      .then(setData)
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false))
  }, [page, sortBy, order, search, roleFilter, statusFilter])

  useEffect(() => { loadUsers() }, [loadUsers])

  function handleSearchSubmit(e) {
    e.preventDefault()
    setPage(1)
    loadUsers()
  }

  function openStatusConfirm(u) {
    setConfirmModal({
      open: true,
      action: u.is_active ? 'deactivate' : 'activate',
      user: u,
    })
  }

  function openDeleteConfirm(u) {
    setConfirmModal({ open: true, action: 'delete', user: u })
  }

  async function handleConfirm() {
    const { action, user } = confirmModal
    setConfirmModal({ open: false, action: null, user: null })
    try {
      if (action === 'delete') {
        await deleteAdminUser(user.id)
      } else {
        await setUserStatus(user.id, action === 'activate')
      }
      loadUsers()
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed.')
    }
  }

  const SortButton = ({ field, label }) => (
    <button
      onClick={() => {
        if (sortBy === field) setOrder(o => o === 'asc' ? 'desc' : 'asc')
        else { setSortBy(field); setOrder('asc') }
      }}
      className="flex items-center gap-1 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
    >
      {label}
      {sortBy === field && (
        <span className="text-blue-400">{order === 'asc' ? '↑' : '↓'}</span>
      )}
    </button>
  )

  return (
    <AdminLayout title="User Management">
      <div className="space-y-4">
        {/* Filters bar */}
        <div className="rounded-xl p-4 bg-[var(--bg-card)] border border-[var(--border-color)]">
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Search</label>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Name or email…"
                className="w-full px-3 py-2 rounded-lg text-sm text-slate-200 placeholder-slate-600 outline-none"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Role</label>
              <select
                value={roleFilter}
                onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
                className="px-3 py-2 rounded-lg text-sm text-slate-200 outline-none"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
              >
                <option value="">All roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                className="px-3 py-2 rounded-lg text-sm text-slate-200 outline-none"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            {error}
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {data ? `${data.total} user${data.total !== 1 ? 's' : ''}` : 'Users'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="px-5 py-3 text-left"><SortButton field="name" label="Name" /></th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left"><SortButton field="created_at" label="Registered" /></th>
                  <th className="px-5 py-3 text-left"><SortButton field="last_login" label="Last Login" /></th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500 text-sm">Loading…</td>
                  </tr>
                )}
                {!loading && data?.users?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500 text-sm">No users found.</td>
                  </tr>
                )}
                {!loading && data?.users?.map(u => (
                  <tr key={u.id} className="border-b border-[var(--border-color)] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-slate-200 font-medium">{u.name}</td>
                    <td className="px-5 py-3 text-slate-400">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${ROLE_BADGE[u.role] || ROLE_BADGE.user}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${STATUS_BADGE[String(u.is_active)]}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{fmtDate(u.created_at)}</td>
                    <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{fmtDate(u.last_login)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/users/${u.id}`)}
                          className="px-2.5 py-1 rounded text-xs font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 border border-blue-500/20 transition-colors"
                        >
                          View
                        </button>
                        {u.id !== currentUser?.id && (
                          <>
                            <button
                              onClick={() => openStatusConfirm(u)}
                              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
                                u.is_active
                                  ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border-amber-500/20'
                                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border-emerald-500/20'
                              }`}
                            >
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => openDeleteConfirm(u)}
                              className="px-2.5 py-1 rounded text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="px-5 py-3 border-t border-[var(--border-color)] flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Page {data.page} of {data.pages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={data.page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 rounded text-xs font-medium text-slate-400 hover:text-slate-200 disabled:opacity-40 border border-[var(--border-color)] transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={data.page >= data.pages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 rounded text-xs font-medium text-slate-400 hover:text-slate-200 disabled:opacity-40 border border-[var(--border-color)] transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        title={
          confirmModal.action === 'delete' ? 'Delete User' :
          confirmModal.action === 'deactivate' ? 'Deactivate User' : 'Activate User'
        }
        message={
          confirmModal.action === 'delete'
            ? `Permanently delete ${confirmModal.user?.name} (${confirmModal.user?.email}) and all their data? This cannot be undone.`
            : confirmModal.action === 'deactivate'
            ? `Deactivate ${confirmModal.user?.name}? They will not be able to sign in.`
            : `Reactivate ${confirmModal.user?.name}? They will be able to sign in again.`
        }
        confirmLabel={
          confirmModal.action === 'delete' ? 'Delete' :
          confirmModal.action === 'deactivate' ? 'Deactivate' : 'Activate'
        }
        confirmVariant={confirmModal.action === 'activate' ? 'primary' : 'danger'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmModal({ open: false, action: null, user: null })}
      />
    </AdminLayout>
  )
}

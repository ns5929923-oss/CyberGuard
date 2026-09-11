import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import ConfirmModal from '../components/ConfirmModal'
import { fetchAdminUser, fetchUserActivity, setUserStatus, updateAdminUser } from '../services/adminService'
import { useAuth } from '../context/AuthContext'

const SEVERITY_COLOR = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  high:     'text-orange-400 bg-orange-500/10 border-orange-500/20',
  medium:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low:      'text-blue-400 bg-blue-500/10 border-blue-500/20',
  informational: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
}

const RISK_COLOR = {
  critical: 'text-red-400',
  high:     'text-orange-400',
  medium:   'text-amber-400',
  low:      'text-emerald-400',
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-2.5 border-b border-[var(--border-color)] last:border-0">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider sm:w-36 flex-shrink-0">{label}</span>
      <span className="text-sm text-slate-300">{value}</span>
    </div>
  )
}

export default function AdminUserDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const userId = parseInt(id, 10)

  const [user, setUser] = useState(null)
  const [activity, setActivity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmModal, setConfirmModal] = useState({ open: false, action: null })
  const [editRole, setEditRole] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([fetchAdminUser(userId), fetchUserActivity(userId)])
      .then(([u, a]) => { setUser(u); setActivity(a); setEditRole(u.role) })
      .catch(() => setError('User not found or access denied.'))
      .finally(() => setLoading(false))
  }, [userId])

  async function handleSaveRole() {
    setSaving(true)
    try {
      const updated = await updateAdminUser(userId, { role: editRole })
      setUser(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Failed to update role.')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusToggle() {
    setConfirmModal({ open: false, action: null })
    try {
      const updated = await setUserStatus(userId, !user.is_active)
      setUser(updated)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status.')
    }
  }

  if (loading) {
    return <AdminLayout title="User Details"><div className="text-slate-500 text-sm animate-pulse">Loading…</div></AdminLayout>
  }

  if (error && !user) {
    return <AdminLayout title="User Details"><div className="text-red-400 text-sm">{error}</div></AdminLayout>
  }

  return (
    <AdminLayout title={`User: ${user?.name}`}>
      <div className="max-w-4xl space-y-5">
        {/* Back */}
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Users
        </button>

        {error && (
          <div className="px-4 py-3 rounded-lg text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* User info card */}
          <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-1">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">User Information</h2>
            <InfoRow label="Name" value={user.name} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Account Status"
              value={
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${
                  user.is_active ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              }
            />
            <InfoRow label="Registered" value={fmtDate(user.created_at)} />
            <InfoRow label="Last Login" value={fmtDate(user.last_login)} />
          </div>

          {/* Role & actions card */}
          <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Role Management</h2>

            {userId !== currentUser?.id ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Role</label>
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm text-slate-200 outline-none"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  onClick={handleSaveRole}
                  disabled={saving || editRole === user.role}
                  className="w-full py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >
                  {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Role'}
                </button>

                <div className="border-t border-[var(--border-color)] pt-4">
                  <button
                    onClick={() => setConfirmModal({ open: true, action: user.is_active ? 'deactivate' : 'activate' })}
                    className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
                      user.is_active
                        ? 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 border border-amber-500/25'
                        : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/25'
                    }`}
                  >
                    {user.is_active ? 'Deactivate Account' : 'Activate Account'}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500">You cannot modify your own account from this panel.</p>
            )}
          </div>
        </div>

        {/* Activity */}
        {activity && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ActivityCard label="Total Scans" value={activity.total_scans} accent="blue" />
            <ActivityCard label="Total Findings" value={activity.total_findings} accent="orange" />
            <ActivityCard label="Risk Distribution" value={
              Object.entries(activity.risk_distribution).length === 0
                ? 'No scans'
                : Object.entries(activity.risk_distribution)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' · ')
            } accent="red" />
          </div>
        )}

        {/* Recent scans */}
        {activity?.recent_scans?.length > 0 && (
          <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border-color)]">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Scans</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    {['ID', 'Target', 'Risk Level', 'Score', 'Findings', 'Date'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activity.recent_scans.map(s => (
                    <tr key={s.id} className="border-b border-[var(--border-color)] last:border-0">
                      <td className="px-5 py-3 text-slate-400">#{s.id}</td>
                      <td className="px-5 py-3 text-slate-200 max-w-xs truncate">{s.target}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold uppercase ${RISK_COLOR[s.risk_level] || 'text-slate-400'}`}>
                          {s.risk_level || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400">{s.score ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-400">{s.findings_count}</td>
                      <td className="px-5 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.action === 'deactivate' ? 'Deactivate Account' : 'Activate Account'}
        message={
          confirmModal.action === 'deactivate'
            ? `Deactivate ${user?.name}? They will not be able to sign in.`
            : `Reactivate ${user?.name}? They will be able to sign in again.`
        }
        confirmLabel={confirmModal.action === 'deactivate' ? 'Deactivate' : 'Activate'}
        confirmVariant={confirmModal.action === 'deactivate' ? 'danger' : 'primary'}
        onConfirm={handleStatusToggle}
        onCancel={() => setConfirmModal({ open: false, action: null })}
      />
    </AdminLayout>
  )
}

function ActivityCard({ label, value, accent }) {
  const colors = {
    blue: 'border-blue-500/20 text-blue-400',
    orange: 'border-orange-500/20 text-orange-400',
    red: 'border-red-500/20 text-red-400',
  }
  return (
    <div className={`rounded-xl p-4 bg-[var(--bg-card)] border ${colors[accent] || colors.blue}`}>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-bold ${colors[accent]?.split(' ')[1]}`}>{value}</p>
    </div>
  )
}

import { useAuth } from '../context/AuthContext'
import AdminLayout from '../components/AdminLayout'

export default function AdminSettings() {
  const { user } = useAuth()

  return (
    <AdminLayout title="Settings">
      <div className="max-w-2xl space-y-5">
        {/* Admin account info */}
        <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div className="px-5 py-4 border-b border-[var(--border-color)]">
            <h2 className="text-sm font-medium text-slate-200">Admin Account</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Name</label>
              <p className="text-sm text-slate-300">{user?.name}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Email</label>
              <p className="text-sm text-slate-300">{user?.email}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Role</label>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/25">
                Administrator
              </span>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Member Since</label>
              <p className="text-sm text-slate-300">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Security note */}
        <div className="rounded-xl bg-[var(--bg-card)] border border-purple-500/20 p-5">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-slate-200 mb-1">Security Information</p>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• All admin actions are authorized server-side via JWT + role verification.</li>
                <li>• Passwords are never stored in plaintext or exposed via API.</li>
                <li>• Admin accounts are created only via the backend seed script.</li>
                <li>• Session tokens expire after 8 hours of inactivity.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

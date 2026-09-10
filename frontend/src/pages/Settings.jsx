import { useAuth } from '../context/AuthContext'
import { DashboardLayout } from './Dashboard'

export default function Settings() {
  const { user } = useAuth()

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-2xl space-y-6">
        {/* Account section */}
        <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div className="px-5 py-4 border-b border-[var(--border-color)]">
            <h2 className="text-sm font-medium text-slate-200">Account</h2>
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
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Member since</label>
              <p className="text-sm text-slate-300">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Coming soon */}
        <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div className="px-5 py-4 border-b border-[var(--border-color)]">
            <h2 className="text-sm font-medium text-slate-200">Preferences</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <p className="text-sm text-slate-500">
              Additional settings will be available in a future update.
            </p>
            <span className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400">
              Coming soon
            </span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

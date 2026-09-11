/**
 * Admin layout wrapper — shared shell for all admin pages.
 */
import { useState } from 'react'
import AdminSidebar from './AdminSidebar'

const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
)

export default function AdminLayout({ title, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center gap-4 px-4 lg:px-6 h-14 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <button
            className="lg:hidden text-slate-400 hover:text-slate-200 transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-widest bg-purple-600/15 border border-purple-500/25 px-2 py-0.5 rounded">
              Admin
            </span>
            <h1 className="text-sm font-semibold text-slate-200">{title}</h1>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

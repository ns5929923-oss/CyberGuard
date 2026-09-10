const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
)

const ShieldSmallIcon = () => (
  <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
)

export default function Navbar({ title, onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 px-4 md:px-6 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]"
      style={{ backdropFilter: 'blur(8px)' }}>
      {/* Mobile menu button */}
      <button
        className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <MenuIcon />
      </button>

      {/* Page title */}
      <div className="flex items-center gap-2">
        <ShieldSmallIcon />
        <h1 className="text-slate-100 font-semibold text-base tracking-tight">{title}</h1>
      </div>

      {/* Right side spacer / future actions slot */}
      <div className="ml-auto flex items-center gap-2">
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
          Live
        </span>
      </div>
    </header>
  )
}

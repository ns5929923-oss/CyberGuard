export default function SecurityScore({ score }) {
  if (score === null || score === undefined) {
    return (
      <div className="rounded-xl p-6 bg-[var(--bg-card)] border border-[var(--border-color)]">
        <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">Security Score</h2>
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="flex items-center justify-center w-24 h-24 rounded-full border-4 border-[var(--border-color)]">
            <span className="text-slate-500 text-sm font-medium">N/A</span>
          </div>
          <p className="text-sm text-slate-500">Run a scan to get your security score</p>
        </div>
      </div>
    )
  }

  const clamped = Math.max(0, Math.min(100, score))
  const circumference = 2 * Math.PI * 44
  const offset = circumference - (clamped / 100) * circumference

  const color =
    clamped >= 80 ? '#10b981'
    : clamped >= 50 ? '#f59e0b'
    : '#ef4444'

  const label =
    clamped >= 80 ? 'Good'
    : clamped >= 50 ? 'Fair'
    : 'Poor'

  return (
    <div className="rounded-xl p-6 bg-[var(--bg-card)] border border-[var(--border-color)]">
      <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">Security Score</h2>
      <div className="flex flex-col items-center justify-center py-4 gap-3">
        <svg width="112" height="112" viewBox="0 0 112 112">
          <circle cx="56" cy="56" r="44" fill="none" stroke="var(--border-color)" strokeWidth="8" />
          <circle
            cx="56" cy="56" r="44"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 56 56)"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
          <text x="56" y="52" textAnchor="middle" fill={color} fontSize="22" fontWeight="700" dominantBaseline="middle">
            {clamped}
          </text>
          <text x="56" y="70" textAnchor="middle" fill="#64748b" fontSize="10">
            {label}
          </text>
        </svg>
        <p className="text-xs text-slate-500">Based on latest scan results</p>
      </div>
    </div>
  )
}

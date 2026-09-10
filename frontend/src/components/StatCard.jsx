export default function StatCard({ label, value, sub, icon, accent = 'blue', isEmpty = false }) {
  const accentMap = {
    blue:   { border: 'border-blue-500/20',    text: 'text-blue-400',    bg: 'bg-blue-500/10',    dot: 'bg-blue-500' },
    green:  { border: 'border-emerald-500/20', text: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500' },
    yellow: { border: 'border-amber-500/20',   text: 'text-amber-400',   bg: 'bg-amber-500/10',   dot: 'bg-amber-500' },
    red:    { border: 'border-red-500/20',     text: 'text-red-400',     bg: 'bg-red-500/10',     dot: 'bg-red-500' },
    orange: { border: 'border-orange-500/20',  text: 'text-orange-400',  bg: 'bg-orange-500/10',  dot: 'bg-orange-500' },
  }
  const colors = accentMap[accent] || accentMap.blue

  return (
    <div className={`rounded-xl p-5 bg-[var(--bg-card)] border ${colors.border} flex flex-col gap-3 hover:border-opacity-60 transition-all duration-150`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        {icon && (
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${colors.bg} ${colors.text}`}>
            {icon}
          </div>
        )}
      </div>
      <div>
        {isEmpty ? (
          <div className="flex items-center gap-2">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors.dot} opacity-30`} />
            <p className="text-sm text-slate-500">No data yet</p>
          </div>
        ) : (
          <>
            <p className={`text-3xl font-bold tabular-nums ${colors.text}`}>{value ?? '—'}</p>
            {sub && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{sub}</p>}
          </>
        )}
      </div>
    </div>
  )
}

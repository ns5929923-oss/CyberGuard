export default function EmptyState({ title = 'No data yet', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] mb-4">
        <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      </div>
      <p className="text-slate-300 font-medium mb-1">{title}</p>
      {message && <p className="text-sm text-slate-500 max-w-xs">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

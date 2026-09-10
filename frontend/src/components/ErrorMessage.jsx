export default function ErrorMessage({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20">
        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-sm text-slate-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  )
}

export default function BauhausEmptyState({ 
  message, 
  className = "px-5 py-8" 
}) {
  return (
    <div className={`relative flex w-full flex-col items-center justify-center overflow-hidden rounded-[1.6rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] ${className}`}>
      <div className="absolute inset-0 pointer-events-none opacity-[0.15]">
        <svg fill="none" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
          {/* Orbit rings (Universe Theme) */}
          <circle cx="200" cy="100" r="140" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" />
          <circle cx="200" cy="100" r="180" stroke="currentColor" strokeWidth="0.5" />
          
          {/* Central geometric star (Orbit Core) */}
          <circle cx="200" cy="100" r="20" className="fill-cyan-400" />
          <circle cx="200" cy="100" r="24" className="stroke-cyan-500/50" strokeWidth="1" fill="none" />
          
          {/* Connecting lines / Bauhaus angles */}
          <line x1="200" y1="100" x2="330" y2="30" stroke="currentColor" strokeWidth="1.5" />
          <polygon points="320,20 340,40 340,20" className="fill-blue-500" />

          <line x1="200" y1="100" x2="60" y2="160" stroke="currentColor" strokeWidth="1.5" />
          <rect x="52" y="152" width="16" height="16" className="fill-red-500" />

          {/* Yellow Bauhaus Accent */}
          <rect x="194" y="24" width="12" height="12" className="fill-yellow-400 -rotate-12" transform="origin-center" />

          {/* Additional sweeping orbits */}
          <path d="M 0 100 Q 200 -100 400 100" stroke="currentColor" strokeWidth="0.5" fill="none" strokeDasharray="2 4" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-[280px]">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-cyan-400/30 bg-[var(--orbit-chat-bg)] shadow-[0_0_20px_rgba(34,211,238,0.15)]">
          <div className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse"></div>
        </div>
        <p className="text-[13px] font-medium leading-6 text-[var(--orbit-text-muted)] drop-shadow-sm">
          {message}
        </p>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom'

function ChannelList({
  server,
  channels = [],
  activeChannelId,
  onSelectChannel,
  settingsHref,
}) {
  return (
    <aside className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-slate-900/90 p-5">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
            Active server
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {server?.name ?? 'Choose a server'}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {server
              ? 'Browse text and announcement channels in the workspace.'
              : 'Server data lands next. The layout is ready for it.'}
          </p>
        </div>

        {settingsHref ? (
          <Link
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.25em] text-slate-300 transition hover:border-white/20 hover:text-white"
            to={settingsHref}
          >
            Gear
          </Link>
        ) : null}
      </div>

      <div className="mt-5 flex-1 space-y-2 overflow-y-auto pr-1">
        {channels.length > 0 ? (
          channels.map((channel) => {
            const isActive = channel.id === activeChannelId

            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => onSelectChannel?.(channel.id)}
                className={[
                  'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition',
                  isActive
                    ? 'border-cyan-300/40 bg-cyan-400/10 text-cyan-50'
                    : 'border-transparent bg-white/5 text-slate-300 hover:border-white/10 hover:bg-white/10 hover:text-white',
                ].join(' ')}
              >
                <span className="truncate text-sm font-medium">
                  # {channel.name}
                </span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                  {channel.channel_type ?? 'text'}
                </span>
              </button>
            )
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-5 text-sm leading-6 text-slate-400">
            Day 11 focuses on the shell. Channel data wiring lands on Day 12.
          </div>
        )}
      </div>
    </aside>
  )
}

export default ChannelList

function ChatWindow({ server, channel, messages = [] }) {
  return (
    <section className="flex h-full min-h-[32rem] flex-col rounded-[2rem] border border-white/10 bg-slate-800/80">
      <header className="border-b border-white/10 px-6 py-5">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
          Chat window
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          {channel?.name ? `# ${channel.name}` : 'Workspace preview'}
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          {server && channel
            ? `Messages for ${server.name} will render here once the data layer is connected.`
            : 'The message area is in place and ready for history + live events.'}
        </p>
      </header>

      <div className="flex flex-1 flex-col justify-between gap-6 px-6 py-6">
        <div className="space-y-4 overflow-y-auto pr-2">
          {messages.length > 0 ? (
            messages.map((message) => (
              <article
                key={message.id}
                className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4"
              >
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-400/10 font-semibold text-cyan-100">
                    {message.author.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <p className="font-medium text-white">{message.author}</p>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                      Preview
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-200">
                  {message.content}
                </p>
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-6 text-sm leading-7 text-slate-300">
              No messages yet. The layout is ready for Day 20 history loading and
              live message rendering.
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
            Composer placeholder
          </p>
          <p className="mt-3 text-sm text-slate-300">
            Message input, websocket send flow, and live history are staged for
            the next set of days.
          </p>
        </div>
      </div>
    </section>
  )
}

export default ChatWindow

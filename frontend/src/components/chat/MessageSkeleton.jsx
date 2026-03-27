function MessageSkeleton({ count = 5 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={`message-skeleton-${index}`}
          className="flex items-start gap-3 rounded-2xl px-3 py-2"
        >
          <div className="orbit-skeleton h-11 w-11 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="orbit-skeleton h-3 w-28 rounded-full" />
              <div className="orbit-skeleton h-2.5 w-20 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="orbit-skeleton h-3 w-full rounded-full" />
              <div className="orbit-skeleton h-3 w-4/5 rounded-full" />
              {index % 2 === 0 ? (
                <div className="orbit-skeleton h-28 w-48 rounded-2xl" />
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MessageSkeleton

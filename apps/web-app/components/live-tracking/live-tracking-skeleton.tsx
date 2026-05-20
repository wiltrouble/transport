export function LiveTrackingSkeleton() {
  return (
    <div className="flex h-[calc(100vh-6rem)] min-h-[560px] animate-pulse flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
      <div className="h-14 border-b border-slate-200 bg-white" />
      <div className="flex min-h-0 flex-1">
        <div className="hidden w-72 border-r border-slate-200 bg-white lg:block">
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
        <div className="flex-1 bg-slate-200" />
      </div>
    </div>
  );
}

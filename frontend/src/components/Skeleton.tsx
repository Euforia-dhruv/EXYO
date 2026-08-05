function Shimmer({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-elevated ${className || ''}`}>
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}
      />
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative w-full h-[80vh] min-h-[500px] bg-bg">
      <Shimmer className="w-full h-full rounded-none" />
      <div className="absolute bottom-0 inset-x-0 p-6 lg:p-10 max-w-[1600px] mx-auto space-y-4">
        <div className="flex gap-2">
          <Shimmer className="w-16 h-6 rounded-xl" />
          <Shimmer className="w-12 h-6 rounded-xl" />
        </div>
        <Shimmer className="w-[500px] h-16 rounded-2xl" />
        <Shimmer className="w-[400px] h-5 rounded-xl" />
        <div className="flex gap-3">
          <Shimmer className="w-28 h-12 rounded-2xl" />
          <Shimmer className="w-28 h-12 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="space-y-4 px-4 max-w-[1600px] mx-auto">
      <Shimmer className="w-40 h-6 rounded-xl" />
      <div className="flex gap-2.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <Shimmer key={i} className="w-[180px] sm:w-[220px] shrink-0 aspect-[2/3] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-bg">
      <Shimmer className="w-full h-[70vh] rounded-none" />
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 -mt-32 relative z-10 space-y-8">
        <div className="flex gap-8">
          <Shimmer className="w-44 aspect-[2/3] rounded-2xl shrink-0 hidden lg:block" />
          <div className="flex-1 space-y-4 pt-20">
            <Shimmer className="w-20 h-5 rounded-xl" />
            <Shimmer className="w-[500px] h-14 rounded-2xl" />
            <div className="flex gap-2">
              <Shimmer className="w-16 h-6 rounded-xl" />
              <Shimmer className="w-20 h-6 rounded-xl" />
            </div>
            <Shimmer className="w-full h-5 rounded-xl" />
            <Shimmer className="w-3/4 h-5 rounded-xl" />
            <div className="flex gap-3 pt-2">
              <Shimmer className="w-28 h-12 rounded-2xl" />
              <Shimmer className="w-28 h-12 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PosterSkeleton() {
  return <Shimmer className="w-full aspect-[2/3] rounded-2xl" />;
}

export function SeasonPillsSkeleton() {
  return (
    <div className="flex gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Shimmer key={i} className="w-24 h-10 rounded-full" />
      ))}
    </div>
  );
}

export function EpisodeGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden bg-card border border-white/[0.04]">
          <Shimmer className="w-full aspect-video rounded-none" />
          <div className="p-4 space-y-2">
            <Shimmer className="h-4 w-24 rounded-lg" />
            <Shimmer className="h-5 w-3/4 rounded-lg" />
            <div className="space-y-1.5">
              <Shimmer className="h-3 w-full rounded-lg" />
              <Shimmer className="h-3 w-2/3 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[150px] md:w-[190px] lg:w-[220px]">
      <div className="aspect-[16/9] shimmer rounded-netflix" />
      <div className="mt-1.5 px-0.5 space-y-1">
        <div className="h-3.5 shimmer rounded w-3/4" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="mb-6">
      <div className="h-4 shimmer rounded w-36 mb-2 ml-4 md:ml-8 lg:ml-12" />
      <div className="flex gap-1.5 px-4 md:px-8 lg:px-12 overflow-hidden">
        {[...Array(7)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="relative h-[90vh] min-h-[600px] max-h-[900px] w-full shimmer">
      <div className="absolute inset-0 bg-gradient-to-r from-exyo-dark via-exyo-dark/50 to-transparent" />
      <div className="absolute bottom-[12%] left-0 right-0 px-6 md:px-8 lg:px-[5vw]">
        <div className="max-w-3xl">
          <div className="h-6 shimmer rounded w-24 mb-3" />
          <div className="h-16 md:h-20 lg:h-24 shimmer rounded-lg w-[60%] mb-3" />
          <div className="flex gap-3 mb-4">
            <div className="h-4 shimmer rounded w-12" />
            <div className="h-4 shimmer rounded w-10" />
            <div className="h-4 shimmer rounded w-16" />
          </div>
          <div className="space-y-1.5 mb-6">
            <div className="h-3.5 shimmer rounded w-full" />
            <div className="h-3.5 shimmer rounded w-5/6" />
            <div className="h-3.5 shimmer rounded w-4/6" />
          </div>
          <div className="flex gap-2.5">
            <div className="h-11 shimmer rounded-netflix w-28" />
            <div className="h-11 shimmer rounded-netflix w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="min-h-screen bg-exyo-dark">
      <div className="relative h-[85vh] min-h-[500px] shimmer" />
      <div className="px-4 md:px-8 lg:px-12 py-8">
        <div className="max-w-3xl">
          <div className="flex gap-1.5 mb-3">
            <div className="h-3 shimmer rounded w-14" />
            <div className="h-3 shimmer rounded w-16" />
          </div>
          <div className="h-14 md:h-16 lg:h-20 shimmer rounded-lg w-[60%] mb-4" />
          <div className="flex gap-3 mb-5">
            <div className="h-4 shimmer rounded w-12" />
            <div className="h-4 shimmer rounded w-10" />
            <div className="h-4 shimmer rounded w-16" />
          </div>
          <div className="space-y-1.5 mb-8">
            <div className="h-3.5 shimmer rounded w-full" />
            <div className="h-3.5 shimmer rounded w-5/6" />
            <div className="h-3.5 shimmer rounded w-4/6" />
          </div>
          <div className="flex gap-2.5">
            <div className="h-11 shimmer rounded-netflix w-28" />
            <div className="h-11 shimmer rounded-netflix w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {[...Array(count)].map((_, i) => (
        <div key={i}>
          <div className="aspect-[16/9] shimmer rounded-netflix mb-1.5" />
          <div className="h-3.5 shimmer rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPlayer() {
  return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/10 border-t-exyo-red" />
    </div>
  );
}

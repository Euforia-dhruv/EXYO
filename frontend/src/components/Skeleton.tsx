export function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[160px] md:w-[200px] lg:w-[240px]">
      <div className="aspect-[2/3] shimmer rounded-lg" />
      <div className="mt-2 px-1 space-y-1.5">
        <div className="h-4 shimmer rounded w-3/4" />
        <div className="h-3 shimmer rounded w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="mb-10">
      <div className="h-5 shimmer rounded w-40 mb-4 ml-6 md:ml-12" />
      <div className="flex gap-3 px-6 md:px-12 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="relative h-[85vh] w-full shimmer">
      <div className="absolute inset-0 bg-gradient-to-r from-exyo-dark via-exyo-dark/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 lg:p-20">
        <div className="max-w-2xl">
          <div className="flex gap-2 mb-4">
            <div className="h-6 shimmer rounded-full w-16" />
            <div className="h-6 shimmer rounded-full w-20" />
          </div>
          <div className="h-16 md:h-20 shimmer rounded-xl w-96 mb-4" />
          <div className="flex gap-4 mb-5">
            <div className="h-4 shimmer rounded w-16" />
            <div className="h-4 shimmer rounded w-12" />
            <div className="h-4 shimmer rounded w-20" />
          </div>
          <div className="space-y-2 mb-8">
            <div className="h-4 shimmer rounded w-full" />
            <div className="h-4 shimmer rounded w-5/6" />
            <div className="h-4 shimmer rounded w-4/6" />
          </div>
          <div className="flex gap-3">
            <div className="h-12 shimmer rounded-lg w-32" />
            <div className="h-12 shimmer rounded-lg w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="min-h-screen">
      <div className="relative h-[80vh] shimmer" />
      <div className="px-6 md:px-12 py-10">
        <div className="max-w-3xl">
          <div className="flex gap-2 mb-4">
            <div className="h-6 shimmer rounded-full w-16" />
            <div className="h-6 shimmer rounded-full w-20" />
          </div>
          <div className="h-14 md:h-18 shimmer rounded-xl w-96 mb-4" />
          <div className="flex gap-4 mb-5">
            <div className="h-4 shimmer rounded w-16" />
            <div className="h-4 shimmer rounded w-12" />
            <div className="h-4 shimmer rounded w-20" />
          </div>
          <div className="space-y-2 mb-8">
            <div className="h-4 shimmer rounded w-full" />
            <div className="h-4 shimmer rounded w-5/6" />
            <div className="h-4 shimmer rounded w-4/6" />
          </div>
          <div className="flex gap-3">
            <div className="h-12 shimmer rounded-lg w-32" />
            <div className="h-12 shimmer rounded-lg w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i}>
          <div className="aspect-[2/3] shimmer rounded-lg mb-2" />
          <div className="h-4 shimmer rounded w-3/4" />
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
